import { randomUUID } from 'node:crypto'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreditsService } from '../credits/credits.service'
import { AiUsageLogService } from './ai-usage-log.service'
import { GeminiTextProvider } from './gemini-text.provider'
import type {
  AiFeatureType,
  StoryGenerationInput,
  StoryResult,
  TextGenerationOutcome,
  WorldGenerationInput,
  WorldResult,
} from './ai.types'

const WORLD_PROMPT_MAX_LENGTH = 1000
const STORY_PROMPT_MAX_LENGTH = 500

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly creditsService: CreditsService,
    private readonly textProvider: GeminiTextProvider,
    private readonly usageLogService: AiUsageLogService,
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
