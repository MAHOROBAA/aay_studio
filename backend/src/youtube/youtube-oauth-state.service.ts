import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

// OAuth state는 브라우저가 Google → 콜백으로 top-level 리다이렉트되는 과정에서 Authorization
// 헤더를 실어 보낼 수 없어, 어떤 AAY 사용자가 연결을 시작했는지와 CSRF 방지를 함께 이 값 하나로
// 처리한다. 서버 상태를 두지 않는 서명 방식이라 Cloud Run 인스턴스가 여러 개여도 문제없다.
const STATE_TTL_MS = 10 * 60 * 1000

type OAuthStatePayload = {
  userId: string
  nonce: string
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

@Injectable()
export class YoutubeOAuthStateService {
  constructor(private readonly configService: ConfigService) {}

  // nonce는 서명된 state 안에도 담기고, 별도로 브라우저의 HttpOnly 쿠키에도 저장된다(컨트롤러
  // 책임). 콜백에서 이 둘이 일치해야만 통과시켜 "연결 요청을 시작한 바로 그 브라우저"에서 돌아온
  // 콜백인지 확인한다 — state 서명 검증만으로는 공격자가 자기 계정에서 받은 OAuth URL을 다른
  // 사용자에게 열게 하는 연결 CSRF를 막을 수 없다.
  sign(params: { userId: string; frontendOrigin: string }): SignedOAuthState {
    const nonce = randomBytes(16).toString('hex')
    const payload: OAuthStatePayload = {
      userId: params.userId,
      nonce,
      frontendOrigin: params.frontendOrigin,
      issuedAt: Date.now(),
    }
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    )
    return {
      state: `${payloadB64}.${this.computeSignature(payloadB64)}`,
      nonce,
    }
  }

  // cookieNonce는 콜백 요청에 실려온 HttpOnly 쿠키 값이다. 없거나 state 안의 nonce와 다르면
  // "연결을 시작한 브라우저가 아님"으로 보고 거부한다.
  verify(params: {
    state: string
    cookieNonce: string | undefined
  }): VerifiedOAuthState {
    const [payloadB64, signature] = params.state.split('.')
    if (!payloadB64 || !signature) {
      throw new UnauthorizedException('유효하지 않은 요청이에요.')
    }

    const expectedSignature = this.computeSignature(payloadB64)
    if (!this.valuesMatch(signature, expectedSignature)) {
      throw new UnauthorizedException('유효하지 않은 요청이에요.')
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as OAuthStatePayload

    if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
      throw new UnauthorizedException(
        '연결 요청이 만료됐어요. 다시 시도해 주세요.',
      )
    }

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
