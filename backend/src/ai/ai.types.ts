export type WorldGenerationInput = {
  prompt: string
}

export type WorldResult = {
  name: string
  shortDescription: string
  description: string
  timeBackground: string
  spaceBackground: string
  rules: string
  restrictions: string
}

export type StorySceneDraft = {
  order: number
  description: string
  dialogue: string
  duration: number
}

export type StoryGenerationInput = {
  prompt: string
  worldContext?: string
}

export type StoryResult = {
  title: string
  summary: string
  scenes: StorySceneDraft[]
}

export type TextGenerationOutcome<T> = {
  result: T
  inputTokens: number
  outputTokens: number
}

export type TextGenerationProvider = {
  generateWorld(
    input: WorldGenerationInput,
  ): Promise<TextGenerationOutcome<WorldResult>>
  generateStory(
    input: StoryGenerationInput,
  ): Promise<TextGenerationOutcome<StoryResult>>
}

export type AiFeatureType = 'WORLD_RECOMMEND' | 'STORY_RECOMMEND'

export type AiUsageLogEntry = {
  userId: string
  generationJobId: string
  featureType: AiFeatureType
  provider: string
  model: string
  inputTokens?: number
  outputTokens?: number
  providerCostUsd?: number
  exchangeRate?: number
  providerCostKrw?: number
  creditReserved: number
  creditConsumed: number
  status: 'SUCCEEDED' | 'FAILED'
  errorMessage?: string
  requestedAt: string
  completedAt: string
  durationMs: number
}
