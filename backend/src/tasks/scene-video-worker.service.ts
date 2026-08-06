import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreditsService } from '../credits/credits.service'
import { StorageService } from '../storage/storage.service'
import { AiUsageLogService } from '../ai-usage-log/ai-usage-log.service'
import { GenerationJobService } from '../generation-jobs/generation-job.service'
import type { GenerationJobRow } from '../generation-jobs/generation-job.service'
import { GeminiVideoProvider } from '../gemini-video/gemini-video.provider'
import type { VideoOperationCheckResult } from '../gemini-video/gemini-video.provider'
import { getVideoCostKrw } from '../gemini-video/video-cost.util'
import { CloudTasksService } from './cloud-tasks.service'

const POLL_DELAY_SECONDS = 10
// 명세에 명시된 값은 아니고, Veo 상태 확인이 영구히 응답하지 않는 경우를 대비한 안전장치로
// 추가했다(10초 간격 x 120회 = 20분 — Cloud Tasks 시작 task의 최대 재시도 기간과 동일하게 맞춤).
const MAX_POLL_ATTEMPTS = 120

@Injectable()
export class SceneVideoWorkerService {
  private readonly logger = new Logger(SceneVideoWorkerService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly creditsService: CreditsService,
    private readonly storageService: StorageService,
    private readonly usageLogService: AiUsageLogService,
    private readonly generationJobService: GenerationJobService,
    private readonly videoProvider: GeminiVideoProvider,
    private readonly cloudTasksService: CloudTasksService,
  ) {}

  // Cloud Tasks가 재시도할 때 동일 jobId로 다시 들어와도, 이미 시작됐거나 끝난 작업이면
  // Veo 생성을 다시 요청하지 않는다(멱등 처리).
  async handleStart(jobId: string, retryCount: number): Promise<void> {
    const job = await this.generationJobService.getById(jobId)
    if (!job) {
      this.logger.warn(`[scene-video/start] job을 찾을 수 없어요: ${jobId}`)
      return
    }

    if (job.status !== 'QUEUED') {
      this.logger.log(
        `[scene-video/start] job ${jobId}는 이미 ${job.status} 상태라 다시 시작하지 않아요.`,
      )
      return
    }

    const maxAttempts = Number(
      this.configService.getOrThrow<string>(
        'CLOUD_TASKS_SCENE_VIDEO_MAX_ATTEMPTS',
      ),
    )
    const isLastAttempt = retryCount >= maxAttempts - 1

    const jobInput = job.input as {
      prompt: string
      referenceImageKey: string | null
    }
    const referenceImage = jobInput.referenceImageKey
      ? await this.loadReferenceImage(job.user_id, jobInput.referenceImageKey)
      : undefined

    try {
      const started = await this.videoProvider.startSceneVideo(
        { prompt: jobInput.prompt },
        referenceImage,
      )
      await this.generationJobService.update(job.id, {
        status: 'PROCESSING',
        provider_operation_id: started.providerOperationId,
        requested_duration_seconds: started.requestedDurationSeconds,
        resolution: started.resolution,
      })
      await this.cloudTasksService.enqueueSceneVideoPoll(
        job.id,
        1,
        POLL_DELAY_SECONDS,
      )
      await this.generationJobService.update(job.id, { poll_attempt: 1 })
    } catch (error) {
      if (!isLastAttempt) {
        // Cloud Tasks 자체 재시도(지수 백오프)에 맡긴다 — job은 QUEUED로 남겨둔다.
        throw error
      }
      // 마지막 시도까지 실패 — 여기서 최종 실패로 확정하고 크레딧을 환불한다.
      await this.finalizeFailure(
        job,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  // "아직 처리 중"은 실패가 아니므로 다음 확인 task를 예약하고 이번 task는 정상 종료(200)한다.
  async handlePoll(jobId: string, pollAttempt: number): Promise<void> {
    const job = await this.generationJobService.getById(jobId)
    if (!job) {
      this.logger.warn(`[scene-video/poll] job을 찾을 수 없어요: ${jobId}`)
      return
    }

    if (job.status !== 'PROCESSING') {
      // 이미 다른 확인 task가 먼저 끝냈거나 실패 처리된 경우 — 멱등 스킵.
      return
    }
    if (!job.provider_operation_id) {
      this.logger.error(
        `[scene-video/poll] job ${jobId}에 operation id가 없어요.`,
      )
      await this.finalizeFailure(
        job,
        'operation id가 없어 상태를 확인할 수 없어요.',
      )
      return
    }

    let checkResult: VideoOperationCheckResult
    try {
      checkResult = await this.videoProvider.checkOperation(
        job.provider_operation_id,
      )
    } catch (error) {
      // 상태 확인 자체가 실패한 경우(네트워크 등)도 "아직 완료 안 됨"과 동일하게 취급해
      // 다음 확인 task를 예약한다 — 전체 폴링 상한이 무한 재시도를 막아준다.
      this.logger.warn(
        `[scene-video/poll] job ${jobId} 상태 확인 실패, 재예약합니다: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      await this.scheduleNextPoll(job, pollAttempt)
      return
    }

    if (!checkResult.done) {
      await this.scheduleNextPoll(job, pollAttempt)
      return
    }

    if (!checkResult.success) {
      await this.finalizeFailure(job, checkResult.errorMessage)
      return
    }

    await this.finalizeSuccess(
      job,
      checkResult.videoBuffer,
      checkResult.mimeType,
    )
  }

  private async loadReferenceImage(
    userId: string,
    objectKey: string,
  ): Promise<{ data: Buffer; mimeType: string }> {
    const { data, contentType } = await this.storageService.getObjectBytes(
      userId,
      objectKey,
    )
    return { data, mimeType: contentType ?? 'image/png' }
  }

  private async scheduleNextPoll(
    job: GenerationJobRow,
    pollAttempt: number,
  ): Promise<void> {
    if (pollAttempt >= MAX_POLL_ATTEMPTS) {
      await this.finalizeFailure(
        job,
        `${MAX_POLL_ATTEMPTS}회 확인해도 생성이 끝나지 않아 시간 초과로 처리했어요.`,
      )
      return
    }

    const nextAttempt = pollAttempt + 1
    await this.cloudTasksService.enqueueSceneVideoPoll(
      job.id,
      nextAttempt,
      POLL_DELAY_SECONDS,
    )
    await this.generationJobService.update(job.id, {
      poll_attempt: nextAttempt,
    })
  }

  private async finalizeSuccess(
    job: GenerationJobRow,
    videoBuffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    const extension = mimeType === 'video/mp4' ? 'mp4' : 'webm'
    const { objectKey } = await this.storageService.uploadObject(
      job.user_id,
      `generated/videos/${job.id}.${extension}`,
      videoBuffer,
      mimeType,
    )

    const actualDurationSeconds = job.requested_duration_seconds ?? 0
    const exchangeRate = Number(
      this.configService.getOrThrow<string>('USD_KRW_EXCHANGE_RATE'),
    )
    const providerCostKrw = getVideoCostKrw(actualDurationSeconds)
    const providerCostUsd = providerCostKrw / exchangeRate
    const reserveAmount = Math.ceil(providerCostKrw)

    const requestedAt = new Date(job.created_at)
    const completedAt = new Date()

    await this.generationJobService.update(job.id, {
      status: 'SUCCEEDED',
      result_object_key: objectKey,
      actual_duration_seconds: actualDurationSeconds,
      completed_at: completedAt.toISOString(),
    })

    // 예약 금액과 정확히 같은 실측 원가라 전액 소비, 환불은 없다.
    await this.creditsService.consume({
      userId: job.user_id,
      amount: reserveAmount,
      generationJobId: job.id,
      idempotencyKey: `ai-consume-${job.id}`,
    })

    await this.usageLogService.record({
      userId: job.user_id,
      generationJobId: job.id,
      featureType: 'SCENE_VIDEO',
      provider: job.provider,
      model: job.model,
      videoDurationSeconds: actualDurationSeconds,
      outputResolution: job.resolution ?? undefined,
      providerCostUsd,
      exchangeRate,
      providerCostKrw,
      creditReserved: reserveAmount,
      creditConsumed: reserveAmount,
      status: 'SUCCEEDED',
      requestedAt: requestedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - requestedAt.getTime(),
    })
  }

  private async finalizeFailure(
    job: GenerationJobRow,
    errorMessage: string,
  ): Promise<void> {
    const durationSeconds = Number(
      this.configService.getOrThrow<string>('AI_VIDEO_DURATION_SECONDS'),
    )
    const reserveAmount = Math.ceil(getVideoCostKrw(durationSeconds))
    const requestedAt = new Date(job.created_at)
    const completedAt = new Date()

    await this.generationJobService.update(job.id, {
      status: 'FAILED',
      error_message: errorMessage,
      completed_at: completedAt.toISOString(),
    })

    await this.creditsService.refund({
      userId: job.user_id,
      amount: reserveAmount,
      reason: 'SCENE_VIDEO 생성 실패로 예약 크레딧 환불',
      idempotencyKey: `ai-refund-failed-${job.id}`,
    })

    await this.usageLogService.record({
      userId: job.user_id,
      generationJobId: job.id,
      featureType: 'SCENE_VIDEO',
      provider: job.provider,
      model: job.model,
      outputResolution: job.resolution ?? undefined,
      creditReserved: reserveAmount,
      creditConsumed: 0,
      status: 'FAILED',
      errorMessage,
      requestedAt: requestedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - requestedAt.getTime(),
    })
  }
}
