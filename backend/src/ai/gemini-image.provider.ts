import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenAI, Modality } from '@google/genai'
import type {
  CharacterImageInput,
  ImageGenerationOutcome,
  ImageGenerationProvider,
  SceneImageInput,
} from './ai.types'

type ReferenceImage = { data: Buffer; mimeType: string }

@Injectable()
export class GeminiImageProvider implements ImageGenerationProvider {
  private readonly client: GoogleGenAI
  private readonly model: string

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GOOGLE_AI_API_KEY')
    this.model = this.configService.getOrThrow<string>('AI_IMAGE_MODEL')
    this.client = new GoogleGenAI({ apiKey })
  }

  async generateCharacter(
    input: CharacterImageInput,
    referenceImage?: ReferenceImage,
  ): Promise<ImageGenerationOutcome> {
    const parts = buildCharacterPrompt(input.prompt, referenceImage)
    return this.generateImage(parts, referenceImage ? 1 : 0)
  }

  async generateScene(
    input: SceneImageInput,
    referenceImages?: ReferenceImage[],
  ): Promise<ImageGenerationOutcome> {
    const parts = buildScenePrompt(input.prompt, referenceImages)
    return this.generateImage(parts, referenceImages?.length ?? 0)
  }

  private async generateImage(
    parts: (string | { inlineData: { data: string; mimeType: string } })[],
    inputImageCount: number,
  ): Promise<ImageGenerationOutcome> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: parts,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    })

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data,
    )
    if (!imagePart?.inlineData?.data) {
      throw new BadRequestException('이미지 생성 결과를 받지 못했어요.')
    }

    return {
      base64Data: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType ?? 'image/png',
      inputImageCount,
      outputImageCount: 1,
    }
  }
}

function buildCharacterPrompt(
  prompt: string,
  referenceImage?: ReferenceImage,
): (string | { inlineData: { data: string; mimeType: string } })[] {
  const parts: (string | { inlineData: { data: string; mimeType: string } })[] =
    []
  if (referenceImage) {
    parts.push(
      '아래 참고 이미지 속 캐릭터와 동일한 외형(얼굴, 의상, 색감)을 유지하면서 새로운 이미지를 생성해줘.',
    )
    parts.push({
      inlineData: {
        data: referenceImage.data.toString('base64'),
        mimeType: referenceImage.mimeType,
      },
    })
  } else {
    parts.push('짧은 영상 콘텐츠에 쓸 캐릭터 대표 이미지를 생성해줘.')
  }
  parts.push(`캐릭터 설명: ${prompt}`)
  return parts
}

function buildScenePrompt(
  prompt: string,
  referenceImages?: ReferenceImage[],
): (string | { inlineData: { data: string; mimeType: string } })[] {
  const parts: (string | { inlineData: { data: string; mimeType: string } })[] =
    []
  if (referenceImages?.length) {
    parts.push(
      '아래 참고 이미지 속 캐릭터들의 외형을 유지하면서 다음 장면을 생성해줘.',
    )
    for (const referenceImage of referenceImages) {
      parts.push({
        inlineData: {
          data: referenceImage.data.toString('base64'),
          mimeType: referenceImage.mimeType,
        },
      })
    }
  } else {
    parts.push('짧은 영상 콘텐츠에 쓸 장면 이미지를 생성해줘.')
  }
  parts.push(`장면 설명: ${prompt}`)
  return parts
}
