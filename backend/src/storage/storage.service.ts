import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  CreateDownloadUrlResult,
  CreateUploadUrlResult,
} from './storage.types'

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300
const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 600

@Injectable()
export class StorageService {
  private readonly client: S3Client
  private readonly bucketName: string

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID')
    const accessKeyId =
      this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID')
    const secretAccessKey = this.configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    )
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME')

    // R2는 S3 호환 API를 region: 'auto' + 계정 전용 엔드포인트로 제공한다.
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  // spec 20.3: users/{userId}/... 아래로만 저장 — 다른 사용자 경로 접근을 원천 차단한다.
  buildObjectKey(userId: string, relativePath: string): string {
    const normalizedPath = relativePath.replace(/^\/+/, '')
    if (!normalizedPath || normalizedPath.includes('..')) {
      throw new BadRequestException('올바르지 않은 경로예요.')
    }
    return `users/${userId}/${normalizedPath}`
  }

  private assertOwnedByUser(userId: string, objectKey: string): void {
    if (!objectKey.startsWith(`users/${userId}/`)) {
      throw new ForbiddenException('본인 파일에만 접근할 수 있어요.')
    }
  }

  async createUploadUrl(
    userId: string,
    relativePath: string,
    contentType: string,
  ): Promise<CreateUploadUrlResult> {
    if (!contentType) {
      throw new BadRequestException('contentType이 필요합니다.')
    }
    const objectKey = this.buildObjectKey(userId, relativePath)
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    })
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
    })
    return {
      objectKey,
      uploadUrl,
      expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
    }
  }

  async createDownloadUrl(
    userId: string,
    objectKey: string,
  ): Promise<CreateDownloadUrlResult> {
    this.assertOwnedByUser(userId, objectKey)
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    })
    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS,
    })
    return { downloadUrl, expiresInSeconds: DOWNLOAD_URL_EXPIRES_IN_SECONDS }
  }

  // AI 생성 결과처럼 서버가 직접 만든 바이트를 R2에 저장할 때 사용한다(클라이언트 업로드는 createUploadUrl).
  async uploadObject(
    userId: string,
    relativePath: string,
    data: Buffer,
    contentType: string,
  ): Promise<{ objectKey: string }> {
    const objectKey = this.buildObjectKey(userId, relativePath)
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: data,
        ContentType: contentType,
      }),
    )
    return { objectKey }
  }

  // 캐릭터 참고 이미지처럼 서버가 직접 내용을 읽어와 AI 요청에 참조로 전달할 때 사용한다.
  async getObjectBytes(
    userId: string,
    objectKey: string,
  ): Promise<{ data: Buffer; contentType?: string }> {
    this.assertOwnedByUser(userId, objectKey)
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
    )
    const bytes = await response.Body?.transformToByteArray()
    if (!bytes) {
      throw new BadRequestException('파일을 읽을 수 없어요.')
    }
    return { data: Buffer.from(bytes), contentType: response.ContentType }
  }
}
