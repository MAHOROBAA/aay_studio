import { randomUUID } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GenerateVideosOperation, GoogleGenAI } from '@google/genai'
import type { Video } from '@google/genai'
import type { SceneVideoInput } from './ai.types'

type ReferenceImage = { data: Buffer; mimeType: string }

export type StartedVideoOperation = {
  providerOperationId: string
  requestedDurationSeconds: number
  resolution: string
}

export type VideoOperationCheckResult =
  | { done: false }
  | { done: true; success: true; videoBuffer: Buffer; mimeType: string }
  | { done: true; success: false; errorMessage: string }

@Injectable()
export class GeminiVideoProvider {
  private readonly client: GoogleGenAI
  private readonly model: string
  private readonly resolution: string
  private readonly durationSeconds: number

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GOOGLE_AI_API_KEY')
    this.model = this.configService.getOrThrow<string>('AI_VIDEO_MODEL')
    this.resolution = this.configService.getOrThrow<string>(
      'AI_VIDEO_RESOLUTION',
    )
    this.durationSeconds = Number(
      this.configService.getOrThrow<string>('AI_VIDEO_DURATION_SECONDS'),
    )
    this.client = new GoogleGenAI({ apiKey })
  }

  async startSceneVideo(
    input: SceneVideoInput,
    referenceImage?: ReferenceImage,
  ): Promise<StartedVideoOperation> {
    const operation = await this.client.models.generateVideos({
      model: this.model,
      source: {
        prompt: input.prompt,
        image: referenceImage
          ? {
              imageBytes: referenceImage.data.toString('base64'),
              mimeType: referenceImage.mimeType,
            }
          : undefined,
      },
      config: {
        numberOfVideos: 1,
        durationSeconds: this.durationSeconds,
        resolution: this.resolution,
      },
    })

    if (!operation.name) {
      throw new BadRequestException('영상 생성 작업 ID를 받지 못했어요.')
    }

    return {
      providerOperationId: operation.name,
      requestedDurationSeconds: this.durationSeconds,
      resolution: this.resolution,
    }
  }

  async checkOperation(
    providerOperationId: string,
  ): Promise<VideoOperationCheckResult> {
    // DB에는 operation name만 저장하므로, 폴링 시점마다 최소 필드만 채운 인스턴스로 재구성한다.
    // getVideosOperation은 내부적으로 operation.name만 읽어 조회 요청을 만들고
    // operation._fromAPIResponse(...)로 새 인스턴스를 반환하므로 이 재구성으로 충분하다.
    const operation = Object.assign(new GenerateVideosOperation(), {
      name: providerOperationId,
    })
    const updated = await this.client.operations.getVideosOperation({
      operation,
    })

    if (!updated.done) {
      return { done: false }
    }
    if (updated.error) {
      return {
        done: true,
        success: false,
        errorMessage: JSON.stringify(updated.error),
      }
    }

    const video = updated.response?.generatedVideos?.[0]?.video
    if (!video) {
      return {
        done: true,
        success: false,
        errorMessage: '생성된 영상을 찾을 수 없어요.',
      }
    }

    const videoBuffer = await this.downloadVideo(video)
    return {
      done: true,
      success: true,
      videoBuffer,
      mimeType: video.mimeType ?? 'video/mp4',
    }
  }

  private async downloadVideo(video: Video): Promise<Buffer> {
    const tempPath = path.join(os.tmpdir(), `aay-video-${randomUUID()}.mp4`)
    await this.client.files.download({ file: video, downloadPath: tempPath })
    const buffer = await fs.readFile(tempPath)
    await fs.unlink(tempPath).catch(() => undefined)
    return buffer
  }
}
