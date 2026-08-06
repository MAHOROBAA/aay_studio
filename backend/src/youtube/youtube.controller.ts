import {
  Controller,
  Delete,
  Get,
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
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('connect')
  @UseGuards(AuthGuard)
  connect(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { authUrl: string } {
    const { authUrl, nonce } = this.youtubeService.buildConnectUrl(
      user.id,
      req.headers.origin,
    )

    // 연결을 시작한 바로 그 브라우저에서 콜백이 돌아왔는지 확인하는 값 — 콜백 경로에서만
    // 전송되도록 path를 좁혀서 노출 범위를 최소화한다.
    res.cookie(OAUTH_NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: OAUTH_NONCE_COOKIE_MAX_AGE_MS,
      path: OAUTH_CALLBACK_PATH,
    })

    return { authUrl }
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
    } catch {
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
