import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenAI, Type } from '@google/genai'
import type {
  StoryGenerationInput,
  StoryResult,
  TextGenerationOutcome,
  TextGenerationProvider,
  WorldGenerationInput,
  WorldResult,
} from './ai.types'

const WORLD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    shortDescription: { type: Type.STRING },
    description: { type: Type.STRING },
    timeBackground: { type: Type.STRING },
    spaceBackground: { type: Type.STRING },
    rules: { type: Type.STRING },
    restrictions: { type: Type.STRING },
  },
  required: [
    'name',
    'shortDescription',
    'description',
    'timeBackground',
    'spaceBackground',
    'rules',
    'restrictions',
  ],
  propertyOrdering: [
    'name',
    'shortDescription',
    'description',
    'timeBackground',
    'spaceBackground',
    'rules',
    'restrictions',
  ],
}

const STORY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          description: { type: Type.STRING },
          dialogue: { type: Type.STRING },
          duration: { type: Type.INTEGER },
        },
        required: ['order', 'description', 'dialogue', 'duration'],
        propertyOrdering: ['order', 'description', 'dialogue', 'duration'],
      },
    },
  },
  required: ['title', 'summary', 'scenes'],
  propertyOrdering: ['title', 'summary', 'scenes'],
}

@Injectable()
export class GeminiTextProvider implements TextGenerationProvider {
  private readonly client: GoogleGenAI
  private readonly model: string

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GOOGLE_AI_API_KEY')
    this.model = this.configService.getOrThrow<string>('AI_TEXT_MODEL')
    this.client = new GoogleGenAI({ apiKey })
  }

  async generateWorld(
    input: WorldGenerationInput,
  ): Promise<TextGenerationOutcome<WorldResult>> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildWorldPrompt(input.prompt),
      config: {
        responseMimeType: 'application/json',
        responseSchema: WORLD_RESPONSE_SCHEMA,
      },
    })
    return {
      result: JSON.parse(response.text ?? '{}') as WorldResult,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    }
  }

  async generateStory(
    input: StoryGenerationInput,
  ): Promise<TextGenerationOutcome<StoryResult>> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildStoryPrompt(input),
      config: {
        responseMimeType: 'application/json',
        responseSchema: STORY_RESPONSE_SCHEMA,
      },
    })
    return {
      result: JSON.parse(response.text ?? '{}') as StoryResult,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    }
  }
}

function buildWorldPrompt(prompt: string): string {
  return [
    '너는 짧은 영상 콘텐츠 제작을 돕는 세계관 설정 도우미야.',
    '사용자의 아이디어를 바탕으로 세계관을 구체화해서 JSON으로만 응답해.',
    `사용자 아이디어: ${prompt}`,
  ].join('\n')
}

function buildStoryPrompt(input: StoryGenerationInput): string {
  const lines = [
    '너는 짧은 영상 콘텐츠 제작을 돕는 스토리 작가야.',
    '사용자의 아이디어를 바탕으로 스토리와 장면 구성을 JSON으로만 응답해.',
    `사용자 아이디어: ${input.prompt}`,
  ]
  if (input.worldContext) {
    lines.push(`세계관 설정: ${input.worldContext}`)
  }
  return lines.join('\n')
}
