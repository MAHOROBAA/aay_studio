import type { GenerationJobStatus } from '../generation-jobs/generation-job.service'

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

export type SceneVideoInput = {
  prompt: string
  referenceImageKey?: string
}

export type GenerationJobSummary = {
  jobId: string
  status: GenerationJobStatus
  errorMessage?: string
  downloadUrl?: string
}

export type RenderContentInput = {
  sceneObjectKeys: string[]
}

export type RenderContentResult = {
  contentId: string
  status: 'SUCCEEDED' | 'FAILED'
  downloadUrl?: string
  errorMessage?: string
}
