import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { RequestUser } from '../auth/auth.types'
import { readCookie } from './youtube-cookie.util'
import { YoutubeService } from './youtube.service'
import type { YoutubeConnectionSummary } from './youtube.types'

const OAUTH_CALLBACK_PATH = '/youtube/oauth/callback'
const OAUTH_NONCE_COOKIE = 'aay_yt_oauth_nonce'
const OAUTH_NONCE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000

// 운영(Cloud Run, Dockerfile에서 NODE_ENV=production 고정)에서는 반드시 Secure를 켠다.
// 로컬 dev(`nest start`)는 HTTP라 Secure 쿠키가 아예 저장되지 않으므로 그때만 끈다.
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

@Controller('youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name)

  constructor(private readonly youtubeService: YoutubeService) {}

  // 이 요청은 프론트(다른 origin)에서 fetch로 호출한다 — Bearer 인증은 여기서 확인하고,
  // 실제 쿠키 설정은 first-party top-level 이동인 /connect/start에서 한다. cross-origin
  // fetch 응답으로 쿠키를 심으면 브라우저의 서드파티 쿠키 차단에 걸릴 수 있어 이렇게 나눴다.
  @Get('connect')
  @UseGuards(AuthGuard)
  connect(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ): { ticket: string } {
    return {
      ticket: this.youtubeService.issueConnectTicket(
        user.id,
        req.headers.origin,
      ),
    }
  }

  // 프론트가 팝업으로 이 경로에 직접(top-level) 이동시킨다 — 같은 도메인으로의 일반 페이지
  // 이동이라 여기서 심는 쿠키는 first-party로 취급돼 브라우저에 정상적으로 저장된다.
  @Get('connect/start')
  connectStart(
    @Query('ticket') ticket: string | undefined,
    @Res() res: Response,
  ): void {
    let authUrl: string
    let nonce: string
    try {
      if (!ticket) {
        throw new Error('ticket query 파라미터가 없어요.')
      }
      ;({ authUrl, nonce } =
        this.youtubeService.buildConnectUrlFromTicket(ticket))
    } catch (error) {
      this.logger.warn(
        `[connect/start] 티켓 검증 실패: ${error instanceof Error ? error.message : String(error)}`,
      )
      res
        .type('html')
        .send(
          this.renderResultPage(
            false,
            null,
            this.youtubeService.resolveNotifyOrigin(undefined),
          ),
        )
      return
    }

    // 연결을 시작한 바로 그 브라우저에서 콜백이 돌아왔는지 확인하는 값 — 콜백 경로에서만
    // 전송되도록 path를 좁혀서 노출 범위를 최소화한다.
    res.cookie(OAUTH_NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: OAUTH_NONCE_COOKIE_MAX_AGE_MS,
      path: OAUTH_CALLBACK_PATH,
    })

    res.redirect(authUrl)
  }

  // Google이 사용자 브라우저를 top-level 리다이렉트로 이 경로로 돌려보낸다 — Authorization
  // 헤더를 실을 수 없어 AuthGuard를 적용하지 않고, state 서명 + 브라우저 쿠키 nonce로
  // 사용자와 요청 출처를 함께 검증한다. 팝업으로 열린 창을 postMessage로 부모(AAY 화면)에
  // 결과를 알리고 스스로 닫는다.
  @Get('oauth/callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const cookieNonce = readCookie(req.headers.cookie, OAUTH_NONCE_COOKIE)
    // 성공/실패 여부와 무관하게 한 번 쓰면 즉시 폐기해 재사용을 막는다.
    res.clearCookie(OAUTH_NONCE_COOKIE, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: OAUTH_CALLBACK_PATH,
    })

    if (oauthError || !code || !state) {
      this.logger.warn(
        `[oauth/callback] code/state 누락 또는 Google 오류: ${oauthError ?? '(code/state 없음)'}`,
      )
      res
        .type('html')
        .send(
          this.renderResultPage(
            false,
            null,
            this.youtubeService.resolveNotifyOrigin(state),
          ),
        )
      return
    }

    try {
      const { channelTitle, frontendOrigin } =
        await this.youtubeService.handleCallback(code, state, cookieNonce)
      res
        .type('html')
        .send(this.renderResultPage(true, channelTitle, frontendOrigin))
    } catch (error) {
      // code/state 원문(사용자 식별 정보 포함)은 로그에 남기지 않고, 실패 원인만 남긴다.
      this.logger.error(
        '[oauth/callback] 처리 실패',
        error instanceof Error ? error.stack : String(error),
      )
      res
        .type('html')
        .send(
          this.renderResultPage(
            false,
            null,
            this.youtubeService.resolveNotifyOrigin(state),
          ),
        )
    }
  }

  @Get('connections')
  @UseGuards(AuthGuard)
  listConnections(
    @CurrentUser() user: RequestUser,
  ): Promise<YoutubeConnectionSummary[]> {
    return this.youtubeService.listConnections(user.id)
  }

  @Delete('connections/:id')
  @UseGuards(AuthGuard)
  disconnect(
    @CurrentUser() user: RequestUser,
    @Param('id') connectionId: string,
  ): Promise<void> {
    return this.youtubeService.disconnect(user.id, connectionId)
  }

  // 채널명이 사용자가 자유롭게 정하는 문자열이라 <script> 안에 그대로 넣지 않고 JSON.stringify로
  // 이스케이프한 뒤 </script> 탈출까지 막는다. targetOrigin도 반드시 허용 목록으로 검증된
  // 값만 받아 그대로 문자열 리터럴로 박아 넣는다(호출부 책임).
  private renderResultPage(
    success: boolean,
    channelTitle: string | null,
    targetOrigin: string,
  ): string {
    const payload = JSON.stringify({
      type: 'aay-youtube-oauth-result',
      success,
      channelTitle,
    }).replace(/</g, '\\u003c')
    const originLiteral = JSON.stringify(targetOrigin).replace(/</g, '\\u003c')

    return `<!doctype html><html><body><script>
      if (window.opener) { window.opener.postMessage(${payload}, ${originLiteral}) }
      window.close()
    </script></body></html>`
  }
}
