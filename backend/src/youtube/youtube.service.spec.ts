import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { YoutubeService } from './youtube.service'
import type { YoutubeConnectionService } from './youtube-connection.service'
import type { YoutubeOAuthStateService } from './youtube-oauth-state.service'
import type { YoutubeTokenEncryptionService } from './youtube-token-encryption.service'

const generateAuthUrlMock = jest.fn<string, [unknown]>()
const getTokenMock = jest.fn<
  Promise<{ tokens: Record<string, unknown> }>,
  [string]
>()

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: (arg: unknown): string => generateAuthUrlMock(arg),
    getToken: (code: string): Promise<{ tokens: Record<string, unknown> }> =>
      getTokenMock(code),
  })),
}))

type MockedConnectionService = {
  upsert: jest.Mock
  listForUser: jest.Mock
  getOwnedById: jest.Mock
  markDisconnected: jest.Mock
}
type MockedStateService = {
  sign: jest.Mock
  verify: jest.Mock
  peekUnverifiedFrontendOrigin: jest.Mock
}
type MockedTokenEncryptionService = { encrypt: jest.Mock; decrypt: jest.Mock }

describe('YoutubeService', () => {
  const PROD_ORIGIN = 'https://aay-studio.vercel.app'
  const DEV_ORIGIN = 'http://localhost:5173'
  const fakeConfig: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    YOUTUBE_REDIRECT_URI: 'https://backend.example/youtube/oauth/callback',
    FRONTEND_ORIGIN: PROD_ORIGIN,
    FRONTEND_DEV_ORIGIN: DEV_ORIGIN,
  }
  const configService = {
    getOrThrow: (key: string) => fakeConfig[key],
    get: (key: string) => fakeConfig[key],
  } as unknown as ConfigService

  let connectionService: MockedConnectionService
  let stateService: MockedStateService
  let tokenEncryptionService: MockedTokenEncryptionService
  let service: YoutubeService
  let fetchMock: jest.Mock

  beforeEach(() => {
    generateAuthUrlMock.mockReset()
    getTokenMock.mockReset()
    connectionService = {
      upsert: jest.fn(),
      listForUser: jest.fn(),
      getOwnedById: jest.fn(),
      markDisconnected: jest.fn(),
    }
    stateService = {
      sign: jest.fn(),
      verify: jest.fn(),
      peekUnverifiedFrontendOrigin: jest.fn(),
    }
    tokenEncryptionService = { encrypt: jest.fn(), decrypt: jest.fn() }
    fetchMock = jest.fn()
    global.fetch = fetchMock

    service = new YoutubeService(
      configService,
      connectionService as unknown as YoutubeConnectionService,
      stateService as unknown as YoutubeOAuthStateService,
      tokenEncryptionService as unknown as YoutubeTokenEncryptionService,
    )
  })

  describe('buildConnectUrl', () => {
    it('허용된 요청 origin이면 그대로 state에 담아 서명한다', () => {
      stateService.sign.mockReturnValue({
        state: 'signed-state',
        nonce: 'nonce-1',
      })
      generateAuthUrlMock.mockReturnValue(
        'https://accounts.google.com/o/oauth2/auth?mock=1',
      )

      const result = service.buildConnectUrl('user-123', DEV_ORIGIN)

      expect(stateService.sign).toHaveBeenCalledWith({
        userId: 'user-123',
        frontendOrigin: DEV_ORIGIN,
      })
      expect(generateAuthUrlMock).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'signed-state',
          prompt: 'consent',
          access_type: 'offline',
        }),
      )
      expect(result).toEqual({
        authUrl: 'https://accounts.google.com/o/oauth2/auth?mock=1',
        state: 'signed-state',
        nonce: 'nonce-1',
      })
    })

    it('허용 목록에 없는 origin이면 운영 origin으로 대체한다', () => {
      stateService.sign.mockReturnValue({
        state: 'signed-state',
        nonce: 'nonce-1',
      })
      generateAuthUrlMock.mockReturnValue(
        'https://accounts.google.com/o/oauth2/auth?mock=1',
      )

      service.buildConnectUrl('user-123', 'https://evil.example')

      expect(stateService.sign).toHaveBeenCalledWith({
        userId: 'user-123',
        frontendOrigin: PROD_ORIGIN,
      })
    })
  })

  it('콜백 처리 시 쿠키 nonce를 함께 검증하고, 토큰을 암호화해서 저장한다', async () => {
    stateService.verify.mockReturnValue({
      userId: 'user-123',
      frontendOrigin: DEV_ORIGIN,
    })
    getTokenMock.mockResolvedValue({
      tokens: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expiry_date: 1234567890000,
      },
    })
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => ({
        items: [
          {
            id: 'channel-1',
            snippet: {
              title: '마호의유튜브',
              thumbnails: { default: { url: 'https://thumb' } },
            },
          },
        ],
      }),
    })
    tokenEncryptionService.encrypt.mockImplementation(
      (value: string) => `encrypted(${value})`,
    )

    const result = await service.handleCallback(
      'auth-code',
      'signed-state',
      'nonce-1',
    )

    expect(stateService.verify).toHaveBeenCalledWith({
      state: 'signed-state',
      cookieNonce: 'nonce-1',
    })
    expect(connectionService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        youtubeChannelId: 'channel-1',
        channelTitle: '마호의유튜브',
        refreshTokenEncrypted: 'encrypted(refresh-token)',
        accessTokenEncrypted: 'encrypted(access-token)',
      }),
    )
    expect(result).toEqual({
      userId: 'user-123',
      channelTitle: '마호의유튜브',
      frontendOrigin: DEV_ORIGIN,
    })
  })

  it('refresh_token을 받지 못하면 연결을 저장하지 않고 실패시킨다', async () => {
    stateService.verify.mockReturnValue({
      userId: 'user-123',
      frontendOrigin: PROD_ORIGIN,
    })
    getTokenMock.mockResolvedValue({ tokens: { access_token: 'access-token' } })

    await expect(
      service.handleCallback('auth-code', 'signed-state', 'nonce-1'),
    ).rejects.toThrow(UnauthorizedException)
    expect(connectionService.upsert).not.toHaveBeenCalled()
  })

  it('state/쿠키 nonce 검증에 실패하면 토큰 교환을 시도하지 않는다', async () => {
    stateService.verify.mockImplementation(() => {
      throw new UnauthorizedException(
        '연결을 시작한 브라우저에서 계속해 주세요.',
      )
    })

    await expect(
      service.handleCallback('auth-code', 'bad-state', undefined),
    ).rejects.toThrow(UnauthorizedException)
    expect(getTokenMock).not.toHaveBeenCalled()
  })

  describe('resolveNotifyOrigin', () => {
    it('state에 담긴 origin이 허용 목록에 있으면 그대로 쓴다', () => {
      stateService.peekUnverifiedFrontendOrigin.mockReturnValue(DEV_ORIGIN)
      expect(service.resolveNotifyOrigin('some-state')).toBe(DEV_ORIGIN)
    })

    it('state를 파싱할 수 없거나 허용 목록에 없으면 운영 origin으로 대체한다', () => {
      stateService.peekUnverifiedFrontendOrigin.mockReturnValue(
        'https://evil.example',
      )
      expect(service.resolveNotifyOrigin('some-state')).toBe(PROD_ORIGIN)
      expect(service.resolveNotifyOrigin(undefined)).toBe(PROD_ORIGIN)
    })
  })

  it('연결 해제 시 소유권만 확인하고 Google 토큰은 건드리지 않는다', async () => {
    connectionService.getOwnedById.mockResolvedValue({ id: 'conn-1' })

    await service.disconnect('user-123', 'conn-1')

    expect(connectionService.getOwnedById).toHaveBeenCalledWith(
      'user-123',
      'conn-1',
    )
    expect(connectionService.markDisconnected).toHaveBeenCalledWith('conn-1')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(tokenEncryptionService.decrypt).not.toHaveBeenCalled()
  })

  it('연결이 본인 소유가 아니면 연결 해제를 진행하지 않는다', async () => {
    connectionService.getOwnedById.mockRejectedValue(new Error('찾을 수 없음'))

    await expect(service.disconnect('user-123', 'conn-1')).rejects.toThrow()
    expect(connectionService.markDisconnected).not.toHaveBeenCalled()
  })
})
