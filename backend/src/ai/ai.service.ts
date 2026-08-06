import { randomUUID } from 'node:crypto'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreditsService } from '../credits/credits.service'
import { StorageService } from '../storage/storage.service'
import { AiUsageLogService } from '../ai-usage-log/ai-usage-log.service'
import type { AiFeatureType } from '../ai-usage-log/ai-usage-log.types'
import { GenerationJobService } from '../generation-jobs/generation-job.service'
import type { GenerationJobStatus } from '../generation-jobs/generation-job.service'
import { CloudTasksService } from '../tasks/cloud-tasks.service'
import { getVideoCostKrw } from '../gemini-video/video-cost.util'
import { ContentService } from './content.service'
import { FfmpegConcatService } from './ffmpeg-concat.service'
import { GeneratedAssetService } from './generated-asset.service'
import { GeminiImageProvider } from './gemini-image.provider'
import { GeminiTextProvider } from './gemini-text.provider'
import type {
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
    private readonly usageLogService: AiUsageLogService,
    private readonly generatedAssetService: GeneratedAssetService,
    private readonly generationJobService: GenerationJobService,
    private readonly contentService: ContentService,
    private readonly ffmpegConcatService: FfmpegConcatService,
    private readonly cloudTasksService: CloudTasksService,
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

  // Cloud Tasks 비동기 구조: 이 메서드는 입력 검증·크레딧 예약·job 생성·task 등록만 하고
  // 즉시 반환한다. 실제 Gemini/Veo 호출과 완료 확인·R2 업로드는 Worker(tasks 모듈)가 처리한다.
  async requestSceneVideo(
    userId: string,
    input: SceneVideoInput,
  ): Promise<{ jobId: string; status: GenerationJobStatus }> {
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
    const durationSeconds = Number(
      this.configService.getOrThrow<string>('AI_VIDEO_DURATION_SECONDS'),
    )
    // 영상은 길이별 원가가 이미 실측으로 확정돼 있어(getVideoCostKrw), 텍스트/이미지처럼
    // "넉넉히 예약 후 환불"이 아니라 정확한 금액을 그대로 예약·소비한다.
    const reserveAmount = Math.ceil(getVideoCostKrw(durationSeconds))

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
      await this.creditsService.reserve({
        userId,
        amount: reserveAmount,
        featureType: 'SCENE_VIDEO',
        idempotencyKey: `ai-reserve-${job.id}`,
      })
    } catch (error) {
      await this.generationJobService.update(job.id, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      throw error
    }

    try {
      await this.cloudTasksService.enqueueSceneVideoStart(job.id)
    } catch (error) {
      await this.creditsService.refund({
        userId,
        amount: reserveAmount,
        reason: 'Cloud Tasks 등록 실패로 예약 크레딧 환불',
        idempotencyKey: `ai-refund-enqueue-failed-${job.id}`,
      })
      await this.generationJobService.update(job.id, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      throw error
    }

    const updated = await this.generationJobService.update(job.id, {
      status: 'QUEUED',
    })
    return { jobId: updated.id, status: updated.status }
  }

  // 프론트엔드 폴링 전용 — DB에 저장된 작업 상태/결과만 조회한다. Veo 상태 확인이나
  // R2 업로드 같은 처리는 하지 않는다(Worker가 사용자 브라우저와 무관하게 계속 처리함).
  async getSceneVideoJob(
    userId: string,
    jobId: string,
  ): Promise<GenerationJobSummary> {
    const job = await this.generationJobService.get(userId, jobId)

    if (job.status === 'SUCCEEDED' && job.result_object_key) {
      const { downloadUrl } = await this.storageService.createDownloadUrl(
        userId,
        job.result_object_key,
      )
      return {
        jobId: job.id,
        status: job.status,
        errorMessage: job.error_message ?? undefined,
        downloadUrl,
      }
    }

    return {
      jobId: job.id,
      status: job.status,
      errorMessage: job.error_message ?? undefined,
    }
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
