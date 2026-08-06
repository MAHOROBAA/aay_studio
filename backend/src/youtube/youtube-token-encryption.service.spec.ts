import { randomBytes } from 'node:crypto'
import { ConfigService } from '@nestjs/config'
import { YoutubeTokenEncryptionService } from './youtube-token-encryption.service'

function buildService(
  key = randomBytes(32).toString('base64'),
): YoutubeTokenEncryptionService {
  const configService = {
    getOrThrow: () => key,
  } as unknown as ConfigService
  return new YoutubeTokenEncryptionService(configService)
}

describe('YoutubeTokenEncryptionService', () => {
  it('암호화한 값을 그대로 복호화한다', () => {
    const service = buildService()
    const plaintext = 'refresh-token-abc-123'

    const encrypted = service.encrypt(plaintext)

    expect(encrypted.startsWith('v1:')).toBe(true)
    expect(encrypted).not.toContain(plaintext)
    expect(service.decrypt(encrypted)).toBe(plaintext)
  })

  it('매번 다른 IV를 사용해 같은 평문도 다른 암호문을 만든다', () => {
    const service = buildService()
    const plaintext = 'same-refresh-token'

    const first = service.encrypt(plaintext)
    const second = service.encrypt(plaintext)

    expect(first).not.toBe(second)
    expect(service.decrypt(first)).toBe(plaintext)
    expect(service.decrypt(second)).toBe(plaintext)
  })

  it('지원하지 않는 버전이면 거부한다', () => {
    const service = buildService()
    expect(() => service.decrypt('v2:aa:bb:cc')).toThrow(
      '지원하지 않는 토큰 암호화 버전',
    )
  })

  it('변조된 authTag는 복호화에 실패한다', () => {
    const service = buildService()
    const encrypted = service.encrypt('refresh-token-abc-123')
    const [version, iv, authTagB64, ciphertext] = encrypted.split(':')
    const authTag = Buffer.from(authTagB64, 'base64')
    authTag[0] ^= 0xff // 길이는 그대로 두고 한 바이트만 뒤집어 무결성 검증만 깨뜨린다
    const tampered = [version, iv, authTag.toString('base64'), ciphertext].join(
      ':',
    )

    expect(() => service.decrypt(tampered)).toThrow()
  })

  it('키 길이가 32바이트가 아니면 생성 시점에 거부한다', () => {
    expect(() =>
      buildService(Buffer.from('too-short-key').toString('base64')),
    ).toThrow('Base64로 인코딩된 32바이트')
  })
})
