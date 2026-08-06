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

  describe('connect ticket', () => {
    it('발급한 티켓에서 원래 userId/frontendOrigin을 복원한다', () => {
      const service = buildService()

      const ticket = service.signConnectTicket({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })

      expect(service.verifyConnectTicket(ticket)).toEqual({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })
    })

    it('서명이 변조된 티켓은 거부한다', () => {
      const service = buildService()
      const ticket = service.signConnectTicket({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })
      const [payload] = ticket.split('.')

      expect(() =>
        service.verifyConnectTicket(`${payload}.tampered-signature`),
      ).toThrow(UnauthorizedException)
    })

    it('만료된 티켓은 거부한다(state보다 훨씬 짧은 수명)', () => {
      const service = buildService()
      const realNow = Date.now
      Date.now = () => realNow() - 2 * 60 * 1000 // 2분 전에 발급된 것처럼
      const ticket = service.signConnectTicket({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })
      Date.now = realNow

      expect(() => service.verifyConnectTicket(ticket)).toThrow(
        UnauthorizedException,
      )
    })

    // state는 URL 쿼리에 노출되는 값이라 ticket보다 유출 가능성이 높다. purpose 구분이
    // 없으면 유출된 state를 ticket 자리에 그대로 넣어 새 연결 흐름을 다시 트리거할 수 있어,
    // 서명 payload 안에 용도를 명시하고 서로 바꿔쓸 수 없게 막는다.
    it('state로 서명된 값은 ticket 검증을 통과하지 못한다', () => {
      const service = buildService()
      const { state } = service.sign({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })

      expect(() => service.verifyConnectTicket(state)).toThrow(
        UnauthorizedException,
      )
    })

    it('ticket으로 서명된 값은 state 검증을 통과하지 못한다', () => {
      const service = buildService()
      const ticket = service.signConnectTicket({
        userId: 'user-123',
        frontendOrigin: 'https://a.example',
      })

      expect(() =>
        service.verify({ state: ticket, cookieNonce: 'anything' }),
      ).toThrow(UnauthorizedException)
    })
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
