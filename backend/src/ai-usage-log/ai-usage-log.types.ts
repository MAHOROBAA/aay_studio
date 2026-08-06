export type AiFeatureType =
  | 'WORLD_RECOMMEND'
  | 'STORY_RECOMMEND'
  | 'CHARACTER_IMAGE'
  | 'SCENE_IMAGE'
  | 'SCENE_VIDEO'
  | 'FINAL_RENDER'

export type AiUsageLogEntry = {
  userId: string
  generationJobId: string
  featureType: AiFeatureType
  provider: string
  model: string
  inputTokens?: number
  outputTokens?: number
  inputImageCount?: number
  outputImageCount?: number
  videoDurationSeconds?: number
  outputResolution?: string
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
