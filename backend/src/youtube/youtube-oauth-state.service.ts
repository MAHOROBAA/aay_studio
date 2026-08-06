import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

// OAuth state는 브라우저가 Google → 콜백으로 top-level 리다이렉트되는 과정에서 Authorization
// 헤더를 실어 보낼 수 없어, 어떤 AAY 사용자가 연결을 시작했는지와 CSRF 방지를 함께 이 값 하나로
// 처리한다. 서버 상태를 두지 않는 서명 방식이라 Cloud Run 인스턴스가 여러 개여도 문제없다.
const STATE_TTL_MS = 10 * 60 * 1000

// connect ticket은 "/youtube/connect"(Bearer 인증)에서 "/youtube/connect/start"(브라우저
// top-level 이동, 인증 헤더를 못 실음)로 사용자 신원을 넘기는 아주 짧은 수명의 1회성 값이다.
const TICKET_TTL_MS = 60 * 1000

// state와 ticket은 서명 방식(HMAC)과 payload 구조가 비슷해서, purpose 구분 없이는 한쪽으로
// 발급된 토큰을 다른 쪽 검증기에 그대로 넣어도 통과해버릴 수 있다. 용도별로 서로 바꿔쓸 수
// 없도록 payload 안에 용도를 명시하고 검증 시 반드시 대조한다.
type OAuthStatePayload = {
  purpose: 'oauth-state'
  userId: string
  nonce: string
  frontendOrigin: string
  issuedAt: number
}

type ConnectTicketPayload = {
  purpose: 'connect-ticket'
  userId: string
  frontendOrigin: string
  issuedAt: number
}

export type SignedOAuthState = {
  state: string
  nonce: string
}

export type VerifiedOAuthState = {
  userId: string
  frontendOrigin: string
}

export type VerifiedConnectTicket = {
  userId: string
  frontendOrigin: string
}

@Injectable()
export class YoutubeOAuthStateService {
  constructor(private readonly configService: ConfigService) {}

  // nonce는 서명된 state 안에도 담기고, 별도로 브라우저의 HttpOnly 쿠키에도 저장된다(컨트롤러
  // 책임). 콜백에서 이 둘이 일치해야만 통과시켜 "연결 요청을 시작한 바로 그 브라우저"에서 돌아온
  // 콜백인지 확인한다 — state 서명 검증만으로는 공격자가 자기 계정에서 받은 OAuth URL을 다른
  // 사용자에게 열게 하는 연결 CSRF를 막을 수 없다.
  sign(params: { userId: string; frontendOrigin: string }): SignedOAuthState {
    const nonce = randomBytes(16).toString('hex')
    const state = this.signPayload<OAuthStatePayload>({
      purpose: 'oauth-state',
      userId: params.userId,
      nonce,
      frontendOrigin: params.frontendOrigin,
      issuedAt: Date.now(),
    })
    return { state, nonce }
  }

  // cookieNonce는 콜백 요청에 실려온 HttpOnly 쿠키 값이다. 없거나 state 안의 nonce와 다르면
  // "연결을 시작한 브라우저가 아님"으로 보고 거부한다.
  verify(params: {
    state: string
    cookieNonce: string | undefined
  }): VerifiedOAuthState {
    const payload = this.verifyPayload<OAuthStatePayload>(
      params.state,
      STATE_TTL_MS,
      'oauth-state',
    )

    if (
      !params.cookieNonce ||
      !this.valuesMatch(payload.nonce, params.cookieNonce)
    ) {
      throw new UnauthorizedException(
        '연결을 시작한 브라우저에서 계속해 주세요.',
      )
    }

    return { userId: payload.userId, frontendOrigin: payload.frontendOrigin }
  }

  // 서명 검증 전 payload를 미리 볼 때 쓴다(실패 시 postMessage를 보낼 origin을 고르는 용도뿐이라
  // 신뢰하면 안 되는 값 취급 — 호출부에서 반드시 허용 목록과 대조해야 한다).
  peekUnverifiedFrontendOrigin(state: string): string | null {
    try {
      const [payloadB64] = state.split('.')
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      ) as { frontendOrigin?: unknown }
      return typeof payload.frontendOrigin === 'string'
        ? payload.frontendOrigin
        : null
    } catch {
      return null
    }
  }

  signConnectTicket(params: {
    userId: string
    frontendOrigin: string
  }): string {
    return this.signPayload<ConnectTicketPayload>({
      purpose: 'connect-ticket',
      userId: params.userId,
      frontendOrigin: params.frontendOrigin,
      issuedAt: Date.now(),
    })
  }

  verifyConnectTicket(ticket: string): VerifiedConnectTicket {
    const payload = this.verifyPayload<ConnectTicketPayload>(
      ticket,
      TICKET_TTL_MS,
      'connect-ticket',
    )
    return { userId: payload.userId, frontendOrigin: payload.frontendOrigin }
  }

  private signPayload<T extends { issuedAt: number }>(payload: T): string {
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    )
    return `${payloadB64}.${this.computeSignature(payloadB64)}`
  }

  private verifyPayload<T extends { issuedAt: number; purpose: string }>(
    token: string,
    ttlMs: number,
    expectedPurpose: T['purpose'],
  ): T {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) {
      throw new UnauthorizedException('유효하지 않은 요청이에요.')
    }

    if (!this.valuesMatch(signature, this.computeSignature(payloadB64))) {
      throw new UnauthorizedException('유효하지 않은 요청이에요.')
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as T

    if (payload.purpose !== expectedPurpose) {
      throw new UnauthorizedException('유효하지 않은 요청이에요.')
    }

    if (Date.now() - payload.issuedAt > ttlMs) {
      throw new UnauthorizedException('요청이 만료됐어요. 다시 시도해 주세요.')
    }

    return payload
  }

  private valuesMatch(actual: string, expected: string): boolean {
    const actualBuf = Buffer.from(actual)
    const expectedBuf = Buffer.from(expected)
    if (actualBuf.length !== expectedBuf.length) {
      return false
    }
    return timingSafeEqual(actualBuf, expectedBuf)
  }

  private computeSignature(payloadB64: string): string {
    const secret = this.configService.getOrThrow<string>(
      'YOUTUBE_OAUTH_STATE_SECRET',
    )
    return createHmac('sha256', secret).update(payloadB64).digest('base64url')
  }
}
