import { randomUUID } from 'node:crypto'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreditsService } from '../credits/credits.service'
import { StorageService } from '../storage/storage.service'
import { AiUsageLogService } from './ai-usage-log.service'
import { ContentService } from './content.service'
import { FfmpegConcatService } from './ffmpeg-concat.service'
import { GeneratedAssetService } from './generated-asset.service'
import { GenerationJobService } from './generation-job.service'
import type { GenerationJobRow } from './generation-job.service'
import { GeminiImageProvider } from './gemini-image.provider'
import { GeminiTextProvider } from './gemini-text.provider'
import { GeminiVideoProvider } from './gemini-video.provider'
import type { VideoOperationCheckResult } from './gemini-video.provider'
import type {
  AiFeatureType,
  CharacterImageInput,
  GeneratedImageResult,
  GenerationJobSummary,
  ImageGenerationOutcome,
  RenderContentInput,
  RenderContentResult,
  SceneImageInput,
  SceneVideoInput,
  StoryGenerationInput,
  StoryResult,
  TextGenerationOutcome,
  WorldGenerationInput,
  WorldResult,
} from './ai.types'

const WORLD_PROMPT_MAX_LENGTH = 1000
const STORY_PROMPT_MAX_LENGTH = 500
const CHARACTER_IMAGE_PROMPT_MAX_LENGTH = 500
const SCENE_IMAGE_PROMPT_MAX_LENGTH = 500
const SCENE_VIDEO_PROMPT_MAX_LENGTH = 500

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly creditsService: CreditsService,
    private readonly storageService: StorageService,
    private readonly textProvider: GeminiTextProvider,
    private readonly imageProvider: GeminiImageProvider,
    private readonly videoProvider: GeminiVideoProvider,
    private readonly usageLogService: AiUsageLogService,
    private readonly generatedAssetService: GeneratedAssetService,
    private readonly generationJobService: GenerationJobService,
    private readonly contentService: ContentService,
    private readonly ffmpegConcatService: FfmpegConcatService,
  ) {}

  async generateWorld(
    userId: string,
    input: WorldGenerationInput,
  ): Promise<WorldResult> {
    if (!input.prompt?.trim()) {
      throw new BadRequestException('세계관 아이디어를 입력해주세요.')
    }
    if (input.prompt.length > WORLD_PROMPT_MAX_LENGTH) {
      throw new BadRequestException(
        `세계관 아이디어는 ${WORLD_PROMPT_MAX_LENGTH}자를 넘을 수 없어요.`,
      )
    }

    return this.runTextGeneration({
      userId,
      featureType: 'WORLD_RECOMMEND',
      reserveCreditEnvKey: 'AI_TEXT_RESERVE_CREDIT_WORLD',
      run: () => this.textProvider.generateWorld(input),
    })
  }

  async generateStory(
    userId: string,
    input: StoryGenerationInput,
  ): Promise<StoryResult> {
    if (!input.prompt?.trim()) {
      throw new BadRequestException('스토리 아이디어를 입력해주세요.')
    }
    if (input.prompt.length > STORY_PROMPT_MAX_LENGTH) {
      throw new BadRequestException(
        `스토리 아이디어는 ${STORY_PROMPT_MAX_LENGTH}자를 넘을 수 없어요.`,
      )
    }

    return this.runTextGeneration({
      userId,
      featureType: 'STORY_RECOMMEND',
      reserveCreditEnvKey: 'AI_TEXT_RESERVE_CREDIT_STORY',
      run: () => this.textProvider.generateStory(input),
    })
  }

  async generateCharacterImage(
    userId: string,
    input: CharacterImageInput,
  ): Promise<GeneratedImageResult> {
    if (!input.prompt?.trim()) {
      throw new BadRequestException('캐릭터 설명을 입력해주세요.')
    }
    if (input.prompt.length > CHARACTER_IMAGE_PROMPT_MAX_LENGTH) {
      throw new BadRequestException(
        `캐릭터 설명은 ${CHARACTER_IMAGE_PROMPT_MAX_LENGTH}자를 넘을 수 없어요.`,
      )
    }

    const referenceImage = input.referenceImageKey
      ? await this.loadReferenceImage(userId, input.referenceImageKey)
      : undefined

    return this.runImageGeneration({
      userId,
      featureType: 'CHARACTER_IMAGE',
      reserveCreditEnvKey: 'AI_IMAGE_RESERVE_CREDIT_CHARACTER',
      pathPrefix: 'generated/characters',
      run: () => this.imageProvider.generateCharacter(input, referenceImage),
    })
  }

  async generateSceneImage(
    userId: string,
    input: SceneImageInput,
  ): Promise<GeneratedImageResult> {
    if (!input.prompt?.trim()) {
      throw new BadRequestException('장면 설명을 입력해주세요.')
    }
    if (input.prompt.length > SCENE_IMAGE_PROMPT_MAX_LENGTH) {
      throw new BadRequestException(
        `장면 설명은 ${SCENE_IMAGE_PROMPT_MAX_LENGTH}자를 넘을 수 없어요.`,
      )
    }

    const referenceImages = input.referenceImageKeys?.length
      ? await Promise.all(
          input.referenceImageKeys.map((key) =>
            this.loadReferenceImage(userId, key),
          ),
        )
      : undefined

    return this.runImageGeneration({
      userId,
      featureType: 'SCENE_IMAGE',
      reserveCreditEnvKey: 'AI_IMAGE_RESERVE_CREDIT_SCENE',
      pathPrefix: 'generated/scenes',
      run: () => this.imageProvider.generateScene(input, referenceImages),
    })
  }

  // spec-addendum-backend.md 18/21장 1차 POC: Cloud Tasks 없이 generation_jobs + provider
  // operation id + 프론트엔드 폴링으로 비동기 구조의 최소 형태만 검증한다. 크레딧 예약/소비
  // 구조는 이번 POC 범위에서 제외하고, 실제 원가만 ai_usage_logs에 기록한다.
  async requestSceneVideo(
    userId: string,
    input: SceneVideoInput,
  ): Promise<{ jobId: string; status: GenerationJobSummary['status'] }> {
    if (!input.prompt?.trim()) {
      throw new BadRequestException('장면 설명을 입력해주세요.')
    }
    if (input.prompt.length > SCENE_VIDEO_PROMPT_MAX_LENGTH) {
      throw new BadRequestException(
        `장면 설명은 ${SCENE_VIDEO_PROMPT_MAX_LENGTH}자를 넘을 수 없어요.`,
      )
    }

    await this.assertUnderCostLimit()

    const provider = this.configService.getOrThrow<string>('AI_VIDEO_PROVIDER')
    const model = this.configService.getOrThrow<string>('AI_VIDEO_MODEL')

    const referenceImage = input.referenceImageKey
      ? await this.loadReferenceImage(userId, input.referenceImageKey)
      : undefined

    const job = await this.generationJobService.create({
      userId,
      featureType: 'SCENE_VIDEO',
      provider,
      model,
      input: {
        prompt: input.prompt,
        referenceImageKey: input.referenceImageKey ?? null,
      },
    })

    try {
      const started = await this.videoProvider.startSceneVideo(
        input,
        referenceImage,
      )
      const updated = await this.generationJobService.update(job.id, {
        status: 'PROCESSING',
        provider_operation_id: started.providerOperationId,
        requested_duration_seconds: started.requestedDurationSeconds,
        resolution: started.resolution,
      })
      return { jobId: updated.id, status: updated.status }
    } catch (error) {
      await this.generationJobService.update(job.id, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      throw error
    }
  }

  async getSceneVideoJob(
    userId: string,
    jobId: string,
  ): Promise<GenerationJobSummary> {
    const job = await this.generationJobService.get(userId, jobId)

    if (job.status !== 'PROCESSING' || !job.provider_operation_id) {
      return toJobSummary(job)
    }

    const requestedAt = new Date(job.created_at)
    let checkResult: VideoOperationCheckResult
    try {
      checkResult = await this.videoProvider.checkOperation(
        job.provider_operation_id,
      )
    } catch (error) {
      const completedAt = new Date()
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const updated = await this.generationJobService.update(job.id, {
        status: 'FAILED',
        error_message: errorMessage,
        completed_at: completedAt.toISOString(),
      })
      await this.usageLogService.record({
        userId,
        generationJobId: job.id,
        featureType: 'SCENE_VIDEO',
        provider: job.provider,
        model: job.model,
        outputResolution: job.resolution ?? undefined,
        creditReserved: 0,
        creditConsumed: 0,
        status: 'FAILED',
        errorMessage,
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })
      return toJobSummary(updated)
    }

    if (!checkResult.done) {
      return toJobSummary(job)
    }

    if (!checkResult.success) {
      const completedAt = new Date()
      const updated = await this.generationJobService.update(job.id, {
        status: 'FAILED',
        error_message: checkResult.errorMessage,
        completed_at: completedAt.toISOString(),
      })
      await this.usageLogService.record({
        userId,
        generationJobId: job.id,
        featureType: 'SCENE_VIDEO',
        provider: job.provider,
        model: job.model,
        outputResolution: job.resolution ?? undefined,
        creditReserved: 0,
        creditConsumed: 0,
        status: 'FAILED',
        errorMessage: checkResult.errorMessage,
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })
      return toJobSummary(updated)
    }

    const extension = checkResult.mimeType === 'video/mp4' ? 'mp4' : 'webm'
    const { objectKey } = await this.storageService.uploadObject(
      userId,
      `generated/videos/${job.id}.${extension}`,
      checkResult.videoBuffer,
      checkResult.mimeType,
    )

    // 이번 POC는 "실제 또는 계산된 비용" 확인이 목적이라 요청한 길이를 실제 길이로 대신 기록한다.
    // FFmpeg 연동(ffprobe) 전이라 다운로드한 파일의 실제 재생 길이는 아직 측정하지 않는다.
    const actualDurationSeconds = job.requested_duration_seconds ?? 0
    const exchangeRate = Number(
      this.configService.getOrThrow<string>('USD_KRW_EXCHANGE_RATE'),
    )
    const providerCostKrw = getVideoCostKrw(actualDurationSeconds)
    const providerCostUsd = providerCostKrw / exchangeRate

    const completedAt = new Date()
    const updated = await this.generationJobService.update(job.id, {
      status: 'SUCCEEDED',
      result_object_key: objectKey,
      actual_duration_seconds: actualDurationSeconds,
      completed_at: completedAt.toISOString(),
    })

    await this.usageLogService.record({
      userId,
      generationJobId: job.id,
      featureType: 'SCENE_VIDEO',
      provider: job.provider,
      model: job.model,
      videoDurationSeconds: actualDurationSeconds,
      outputResolution: job.resolution ?? undefined,
      providerCostUsd,
      exchangeRate,
      providerCostKrw,
      creditReserved: 0,
      creditConsumed: Math.ceil(providerCostKrw),
      status: 'SUCCEEDED',
      requestedAt: requestedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - requestedAt.getTime(),
    })

    const { downloadUrl } = await this.storageService.createDownloadUrl(
      userId,
      objectKey,
    )
    return { ...toJobSummary(updated), downloadUrl }
  }

  // spec-addendum-backend.md 18.2/19.2: 장면별 영상을 순서대로 이어붙여 하나의 콘텐츠로 만든다.
  // 오디오·BGM·자막 삽입은 이번 배치 범위 밖이라 순수 이어붙이기(concat)만 한다.
  // 재인코딩 없이 짧게 끝나는 작업이라 텍스트/이미지처럼 동기 호출로 처리한다.
  async renderContent(
    userId: string,
    input: RenderContentInput,
  ): Promise<RenderContentResult> {
    if (!input.sceneObjectKeys || input.sceneObjectKeys.length < 2) {
      throw new BadRequestException('합칠 장면 영상은 2개 이상 필요합니다.')
    }

    const content = await this.contentService.createContent(userId)
    await this.contentService.createScenes(
      content.id,
      input.sceneObjectKeys.map((videoObjectKey, index) => ({
        sceneOrder: index,
        videoObjectKey,
      })),
    )

    const job = await this.generationJobService.create({
      userId,
      featureType: 'FINAL_RENDER',
      provider: 'ffmpeg',
      model: 'concat-copy',
      input: { sceneObjectKeys: input.sceneObjectKeys, contentId: content.id },
    })

    const requestedAt = new Date()
    try {
      const scenes = await Promise.all(
        input.sceneObjectKeys.map((objectKey) =>
          this.storageService.getObjectBytes(userId, objectKey),
        ),
      )
      const combined = await this.ffmpegConcatService.concat(
        scenes.map((scene) => scene.data),
      )
      const { objectKey } = await this.storageService.uploadObject(
        userId,
        `contents/${content.id}/final.mp4`,
        combined,
        'video/mp4',
      )

      const completedAt = new Date()
      await this.contentService.update(content.id, {
        status: 'SUCCEEDED',
        result_object_key: objectKey,
        completed_at: completedAt.toISOString(),
      })
      await this.generationJobService.update(job.id, {
        status: 'SUCCEEDED',
        result_object_key: objectKey,
        completed_at: completedAt.toISOString(),
      })
      await this.usageLogService.record({
        userId,
        generationJobId: job.id,
        featureType: 'FINAL_RENDER',
        provider: 'ffmpeg',
        model: 'concat-copy',
        creditReserved: 0,
        creditConsumed: 0,
        status: 'SUCCEEDED',
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })

      const { downloadUrl } = await this.storageService.createDownloadUrl(
        userId,
        objectKey,
      )
      return { contentId: content.id, status: 'SUCCEEDED', downloadUrl }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const completedAt = new Date()
      await this.contentService.update(content.id, {
        status: 'FAILED',
        error_message: errorMessage,
        completed_at: completedAt.toISOString(),
      })
      await this.generationJobService.update(job.id, {
        status: 'FAILED',
        error_message: errorMessage,
        completed_at: completedAt.toISOString(),
      })
      await this.usageLogService.record({
        userId,
        generationJobId: job.id,
        featureType: 'FINAL_RENDER',
        provider: 'ffmpeg',
        model: 'concat-copy',
        creditReserved: 0,
        creditConsumed: 0,
        status: 'FAILED',
        errorMessage,
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })
      return { contentId: content.id, status: 'FAILED', errorMessage }
    }
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

  private async runImageGeneration(params: {
    userId: string
    featureType: 'CHARACTER_IMAGE' | 'SCENE_IMAGE'
    reserveCreditEnvKey: string
    pathPrefix: string
    run: () => Promise<ImageGenerationOutcome>
  }): Promise<GeneratedImageResult> {
    const { userId, featureType, reserveCreditEnvKey, pathPrefix, run } = params

    await this.assertUnderCostLimit()

    const provider = this.configService.getOrThrow<string>('AI_IMAGE_PROVIDER')
    const model = this.configService.getOrThrow<string>('AI_IMAGE_MODEL')
    const costPerImageUsd = Number(
      this.configService.getOrThrow<string>('AI_IMAGE_COST_PER_IMAGE_USD'),
    )
    const exchangeRate = Number(
      this.configService.getOrThrow<string>('USD_KRW_EXCHANGE_RATE'),
    )
    const reserveAmount = Number(
      this.configService.getOrThrow<string>(reserveCreditEnvKey),
    )

    const jobId = randomUUID()
    const requestedAt = new Date()

    await this.creditsService.reserve({
      userId,
      amount: reserveAmount,
      featureType,
      idempotencyKey: `ai-reserve-${jobId}`,
    })

    try {
      const { base64Data, mimeType, inputImageCount, outputImageCount } =
        await run()

      const providerCostUsd = outputImageCount * costPerImageUsd
      const providerCostKrw = providerCostUsd * exchangeRate
      const actualCreditCost = Math.ceil(providerCostKrw)
      const creditToConsume = Math.max(
        0,
        Math.min(actualCreditCost, reserveAmount),
      )
      const creditToRefund = reserveAmount - creditToConsume

      if (creditToConsume > 0) {
        await this.creditsService.consume({
          userId,
          amount: creditToConsume,
          generationJobId: jobId,
          idempotencyKey: `ai-consume-${jobId}`,
        })
      }
      if (creditToRefund > 0) {
        await this.creditsService.refund({
          userId,
          amount: creditToRefund,
          reason: `${featureType} 예약 잔여분 환불`,
          idempotencyKey: `ai-refund-${jobId}`,
        })
      }

      if (actualCreditCost > reserveAmount) {
        console.error(
          `[AiService] ${featureType} 실제 비용(${actualCreditCost}크레딧)이 예약량(${reserveAmount}크레딧)을 초과했습니다. ${reserveCreditEnvKey} 값을 올려주세요.`,
        )
      }

      const extension = mimeType === 'image/png' ? 'png' : 'jpg'
      const { objectKey } = await this.storageService.uploadObject(
        userId,
        `${pathPrefix}/${jobId}.${extension}`,
        Buffer.from(base64Data, 'base64'),
        mimeType,
      )
      await this.generatedAssetService.register({
        userId,
        generationJobId: jobId,
        assetType: featureType,
        objectKey,
        mimeType,
      })
      const { downloadUrl } = await this.storageService.createDownloadUrl(
        userId,
        objectKey,
      )

      const completedAt = new Date()
      await this.usageLogService.record({
        userId,
        generationJobId: jobId,
        featureType,
        provider,
        model,
        inputImageCount,
        outputImageCount,
        providerCostUsd,
        exchangeRate,
        providerCostKrw,
        creditReserved: reserveAmount,
        creditConsumed: creditToConsume,
        status: 'SUCCEEDED',
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })

      return { objectKey, downloadUrl }
    } catch (error) {
      await this.creditsService.refund({
        userId,
        amount: reserveAmount,
        reason: `${featureType} 생성 실패로 예약 크레딧 환불`,
        idempotencyKey: `ai-refund-failed-${jobId}`,
      })

      const completedAt = new Date()
      await this.usageLogService.record({
        userId,
        generationJobId: jobId,
        featureType,
        provider,
        model,
        creditReserved: reserveAmount,
        creditConsumed: 0,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })

      throw error
    }
  }

  private async runTextGeneration<T>(params: {
    userId: string
    featureType: AiFeatureType
    reserveCreditEnvKey: string
    run: () => Promise<TextGenerationOutcome<T>>
  }): Promise<T> {
    const { userId, featureType, reserveCreditEnvKey, run } = params

    await this.assertUnderCostLimit()

    const provider = this.configService.getOrThrow<string>('AI_TEXT_PROVIDER')
    const model = this.configService.getOrThrow<string>('AI_TEXT_MODEL')
    const inputCostPer1M = Number(
      this.configService.getOrThrow<string>('AI_TEXT_INPUT_COST_PER_1M_USD'),
    )
    const outputCostPer1M = Number(
      this.configService.getOrThrow<string>('AI_TEXT_OUTPUT_COST_PER_1M_USD'),
    )
    const exchangeRate = Number(
      this.configService.getOrThrow<string>('USD_KRW_EXCHANGE_RATE'),
    )
    const reserveAmount = Number(
      this.configService.getOrThrow<string>(reserveCreditEnvKey),
    )

    const jobId = randomUUID()
    const requestedAt = new Date()

    await this.creditsService.reserve({
      userId,
      amount: reserveAmount,
      featureType,
      idempotencyKey: `ai-reserve-${jobId}`,
    })

    try {
      const { result, inputTokens, outputTokens } = await run()

      const providerCostUsd =
        (inputTokens / 1_000_000) * inputCostPer1M +
        (outputTokens / 1_000_000) * outputCostPer1M
      const providerCostKrw = providerCostUsd * exchangeRate
      const actualCreditCost = Math.ceil(providerCostKrw)
      const creditToConsume = Math.max(
        0,
        Math.min(actualCreditCost, reserveAmount),
      )
      const creditToRefund = reserveAmount - creditToConsume

      if (creditToConsume > 0) {
        await this.creditsService.consume({
          userId,
          amount: creditToConsume,
          generationJobId: jobId,
          idempotencyKey: `ai-consume-${jobId}`,
        })
      }
      if (creditToRefund > 0) {
        await this.creditsService.refund({
          userId,
          amount: creditToRefund,
          reason: `${featureType} 예약 잔여분 환불`,
          idempotencyKey: `ai-refund-${jobId}`,
        })
      }

      if (actualCreditCost > reserveAmount) {
        console.error(
          `[AiService] ${featureType} 실제 비용(${actualCreditCost}크레딧)이 예약량(${reserveAmount}크레딧)을 초과했습니다. ${reserveCreditEnvKey} 값을 올려주세요.`,
        )
      }

      const completedAt = new Date()
      await this.usageLogService.record({
        userId,
        generationJobId: jobId,
        featureType,
        provider,
        model,
        inputTokens,
        outputTokens,
        providerCostUsd,
        exchangeRate,
        providerCostKrw,
        creditReserved: reserveAmount,
        creditConsumed: creditToConsume,
        status: 'SUCCEEDED',
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })

      return result
    } catch (error) {
      await this.creditsService.refund({
        userId,
        amount: reserveAmount,
        reason: `${featureType} 생성 실패로 예약 크레딧 환불`,
        idempotencyKey: `ai-refund-failed-${jobId}`,
      })

      const completedAt = new Date()
      await this.usageLogService.record({
        userId,
        generationJobId: jobId,
        featureType,
        provider,
        model,
        creditReserved: reserveAmount,
        creditConsumed: 0,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
        requestedAt: requestedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - requestedAt.getTime(),
      })

      throw error
    }
  }

  // spec-addendum-backend.md 23.2: 일일/월간 AI 비용이 상한에 도달하면 신규 생성 요청을 막는다.
  private async assertUnderCostLimit(): Promise<void> {
    const dailyLimit = Number(
      this.configService.getOrThrow<string>('DAILY_AI_COST_LIMIT_USD'),
    )
    const monthlyLimit = Number(
      this.configService.getOrThrow<string>('MONTHLY_AI_COST_LIMIT_USD'),
    )

    const now = new Date()
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    )

    const [dailyCost, monthlyCost] = await Promise.all([
      this.usageLogService.getTotalCostUsdSince(startOfDay.toISOString()),
      this.usageLogService.getTotalCostUsdSince(startOfMonth.toISOString()),
    ])

    if (dailyCost >= dailyLimit || monthlyCost >= monthlyLimit) {
      throw new ForbiddenException(
        '현재 테스트 사용량이 한도에 도달했어요. 관리자가 사용량을 확인한 후 다시 이용할 수 있어요.',
      )
    }
  }
}

function toJobSummary(job: GenerationJobRow): GenerationJobSummary {
  return {
    jobId: job.id,
    status: job.status,
    errorMessage: job.error_message ?? undefined,
  }
}

// veo-3.1-lite-generate-preview(720p) 실측 원가(Google AI Studio 청구 내역 기준, 2026-08-03).
// 초당 단가가 아니라 길이별로 다른 요금이 붙는 것으로 확인돼(4초=100.43원, 8초=290.57원 —
// 45% 이상 차이가 나서 선형 비례가 아님), 길이별 고정 요금표로 관리한다.
// 모델이나 해상도가 바뀌면 이 표도 다시 실측해서 갱신해야 한다.
const VIDEO_DURATION_COST_KRW: Record<number, number> = {
  4: 100.43,
  8: 290.57,
}

function getVideoCostKrw(durationSeconds: number): number {
  const exact = VIDEO_DURATION_COST_KRW[durationSeconds]
  if (exact !== undefined) {
    return exact
  }

  // 아직 실측 안 된 길이는 원가를 과소 청구하지 않도록 가장 가까운 상위 구간 요금을 쓴다.
  const knownDurations = Object.keys(VIDEO_DURATION_COST_KRW)
    .map(Number)
    .sort((a, b) => a - b)
  const higherTier =
    knownDurations.find((duration) => duration >= durationSeconds) ??
    knownDurations[knownDurations.length - 1]

  console.error(
    `[AiService] ${durationSeconds}초 영상 원가는 아직 실측되지 않았어요. ${higherTier}초 요금(${VIDEO_DURATION_COST_KRW[higherTier]}원)으로 보수적으로 계산합니다.`,
  )
  return VIDEO_DURATION_COST_KRW[higherTier]
}
