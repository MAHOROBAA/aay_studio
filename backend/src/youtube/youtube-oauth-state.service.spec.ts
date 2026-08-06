import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { YoutubeOAuthStateService } from './youtube-oauth-state.service'

function buildService(secret = 'test-state-secret'): YoutubeOAuthStateService {
  const configService = {
    getOrThrow: () => secret,
  } as unknown as ConfigService
  return new YoutubeOAuthStateService(configService)
}

describe('YoutubeOAuthStateService', () => {
  it('브라우저 쿠키 nonce가 state의 nonce와 일치하면 통과한다', () => {
    const service = buildService()

    const { state, nonce } = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://aay-studio.vercel.app',
    })

    expect(service.verify({ state, cookieNonce: nonce })).toEqual({
      userId: 'user-123',
      frontendOrigin: 'https://aay-studio.vercel.app',
    })
  })

  it('같은 userId라도 매번 다른 state/nonce를 만든다', () => {
    const service = buildService()

    const first = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })
    const second = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })

    expect(first.state).not.toBe(second.state)
    expect(first.nonce).not.toBe(second.nonce)
  })

  // 연결 CSRF 시나리오: 공격자가 자기 계정으로 받은 state를 피해자 브라우저에서 열게 해도,
  // 피해자 브라우저에는 공격자의 쿠키(nonce)가 없으므로 검증에 실패해야 한다.
  it('쿠키 nonce가 없으면 거부한다(연결 CSRF 방지)', () => {
    const service = buildService()
    const { state } = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })

    expect(() => service.verify({ state, cookieNonce: undefined })).toThrow(
      UnauthorizedException,
    )
  })

  it('쿠키 nonce가 state의 nonce와 다르면 거부한다(연결 CSRF 방지)', () => {
    const service = buildService()
    const { state } = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })

    expect(() =>
      service.verify({ state, cookieNonce: 'someone-elses-nonce' }),
    ).toThrow(UnauthorizedException)
  })

  it('서명이 변조되면 거부한다', () => {
    const service = buildService()
    const { state, nonce } = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })
    const [payload] = state.split('.')

    expect(() =>
      service.verify({
        state: `${payload}.tampered-signature`,
        cookieNonce: nonce,
      }),
    ).toThrow(UnauthorizedException)
  })

  it('다른 비밀키로 서명된 state는 거부한다', () => {
    const signer = buildService('secret-a')
    const verifier = buildService('secret-b')
    const { state, nonce } = signer.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })

    expect(() => verifier.verify({ state, cookieNonce: nonce })).toThrow(
      UnauthorizedException,
    )
  })

  it('형식이 올바르지 않으면 거부한다', () => {
    const service = buildService()
    expect(() =>
      service.verify({ state: 'not-a-valid-state', cookieNonce: 'anything' }),
    ).toThrow(UnauthorizedException)
  })

  it('만료된 state는 거부한다', () => {
    const service = buildService()
    const realNow = Date.now
    Date.now = () => realNow() - 11 * 60 * 1000 // 11분 전에 발급된 것처럼
    const { state, nonce } = service.sign({
      userId: 'user-123',
      frontendOrigin: 'https://a.example',
    })
    Date.now = realNow

    expect(() => service.verify({ state, cookieNonce: nonce })).toThrow(
      UnauthorizedException,
    )
  })

  describe('peekUnverifiedFrontendOrigin', () => {
    it('서명 검증 없이 state 안의 frontendOrigin을 읽어온다', () => {
      const service = buildService()
      const { state } = service.sign({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })

      expect(service.peekUnverifiedFrontendOrigin(state)).toBe(
        'https://a.example',
      )
    })

    it('형식이 올바르지 않으면 null을 반환한다', () => {
      const service = buildService()
      expect(
        service.peekUnverifiedFrontendOrigin('not-a-valid-state'),
      ).toBeNull()
    })
  })
})
