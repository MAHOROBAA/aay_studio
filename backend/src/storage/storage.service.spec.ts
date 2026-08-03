import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { StorageService } from './storage.service'

describe('StorageService', () => {
  let service: StorageService

  beforeEach(async () => {
    const fakeConfig: Record<string, string> = {
      R2_ACCOUNT_ID: 'fake-account-id',
      R2_ACCESS_KEY_ID: 'fake-access-key-id',
      R2_SECRET_ACCESS_KEY: 'fake-secret-access-key',
      R2_BUCKET_NAME: 'fake-bucket',
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => fakeConfig[key] },
        },
      ],
    }).compile()

    service = module.get<StorageService>(StorageService)
  })

  describe('buildObjectKey', () => {
    it('사용자 경로 아래에 object key를 만든다', () => {
      const key = service.buildObjectKey('user-1', 'characters/abc/image.png')
      expect(key).toBe('users/user-1/characters/abc/image.png')
    })

    it('빈 경로는 거부한다', () => {
      expect(() => service.buildObjectKey('user-1', '')).toThrow(
        BadRequestException,
      )
    })

    it('상위 경로 이동(..)은 거부한다', () => {
      expect(() =>
        service.buildObjectKey('user-1', '../user-2/secret.png'),
      ).toThrow(BadRequestException)
    })
  })

  describe('createUploadUrl / createDownloadUrl', () => {
    it('본인 경로에는 signed URL을 발급한다', async () => {
      const result = await service.createUploadUrl(
        'user-1',
        'characters/abc/image.png',
        'image/png',
      )
      expect(result.objectKey).toBe('users/user-1/characters/abc/image.png')
      expect(result.uploadUrl).toContain('https://')
    })

    it('다른 사용자의 object key로 다운로드 URL을 요청하면 거부한다', async () => {
      await expect(
        service.createDownloadUrl(
          'user-1',
          'users/user-2/characters/abc/image.png',
        ),
      ).rejects.toThrow(ForbiddenException)
    })

    it('본인 object key로는 다운로드 URL을 발급한다', async () => {
      const result = await service.createDownloadUrl(
        'user-1',
        'users/user-1/characters/abc/image.png',
      )
      expect(result.downloadUrl).toContain('https://')
    })
  })
})
