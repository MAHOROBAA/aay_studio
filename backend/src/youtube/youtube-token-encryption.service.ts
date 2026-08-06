import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH_BYTES = 12
const CURRENT_VERSION = 'v1'

// 저장 형식: v1:iv(base64):authTag(base64):ciphertext(base64)
// 키 교체가 필요해지면 버전 문자열을 늘리고 decrypt()의 switch에 분기를 추가한다 — 기존에
// v1으로 저장된 값도 계속 복호화할 수 있어야 하므로 이전 버전 분기를 지우지 않는다.
@Injectable()
export class YoutubeTokenEncryptionService {
  private readonly key: Buffer

  constructor(configService: ConfigService) {
    const base64Key = configService.getOrThrow<string>(
      'YOUTUBE_TOKEN_ENCRYPTION_KEY',
    )
    this.key = Buffer.from(base64Key, 'base64')
    if (this.key.length !== 32) {
      throw new Error(
        'YOUTUBE_TOKEN_ENCRYPTION_KEY는 Base64로 인코딩된 32바이트 키여야 해요.',
      )
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES)
    const cipher = createCipheriv(ALGORITHM, this.key, iv)
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    return [
      CURRENT_VERSION,
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':')
  }

  decrypt(stored: string): string {
    const [version, ivB64, authTagB64, ciphertextB64] = stored.split(':')

    switch (version) {
      case 'v1':
        return this.decryptV1(ivB64, authTagB64, ciphertextB64)
      default:
        throw new Error(`지원하지 않는 토큰 암호화 버전이에요: ${version}`)
    }
  }

  private decryptV1(
    ivB64: string | undefined,
    authTagB64: string | undefined,
    ciphertextB64: string | undefined,
  ): string {
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new Error('암호화된 토큰 형식이 올바르지 않아요.')
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivB64, 'base64'),
    )
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ])
    return plaintext.toString('utf8')
  }
}
