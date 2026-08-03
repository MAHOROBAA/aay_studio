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

export type CharacterImageInput = {
  prompt: string
  referenceImageKey?: string
}

export type SceneImageInput = {
  prompt: string
  referenceImageKeys?: string[]
}

export type ImageGenerationOutcome = {
  base64Data: string
  mimeType: string
  inputImageCount: number
  outputImageCount: number
}

export type ImageGenerationProvider = {
  generateCharacter(input: CharacterImageInput): Promise<ImageGenerationOutcome>
  generateScene(input: SceneImageInput): Promise<ImageGenerationOutcome>
}

export type GeneratedImageResult = {
  objectKey: string
  downloadUrl: string
}

export type AiFeatureType =
  'WORLD_RECOMMEND' | 'STORY_RECOMMEND' | 'CHARACTER_IMAGE' | 'SCENE_IMAGE'

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
