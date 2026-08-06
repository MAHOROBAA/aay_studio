import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuth2Client } from 'google-auth-library'
import { YoutubeConnectionService } from './youtube-connection.service'
import { YoutubeOAuthStateService } from './youtube-oauth-state.service'
import { YoutubeTokenEncryptionService } from './youtube-token-encryption.service'
import type {
  YoutubeChannelInfo,
  YoutubeConnectionSummary,
} from './youtube.types'

// 업로드 권한(youtube.upload)만으로는 channels.list 조회가 막힐 수 있어 readonly 범위를 더한다.
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]

@Injectable()
export class YoutubeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly connectionService: YoutubeConnectionService,
    private readonly stateService: YoutubeOAuthStateService,
    private readonly tokenEncryptionService: YoutubeTokenEncryptionService,
  ) {}

  // "/youtube/connect"(Bearer 인증)에서 발급한다. 이 티켓을 브라우저가 top-level 이동으로
  // "/youtube/connect/start"에 가져가면, 그 요청은 인증 헤더를 실을 수 없는 대신 이 짧은
  // 서명 티켓 하나로 사용자를 식별한다.
  issueConnectTicket(
    userId: string,
    requestOrigin: string | undefined,
  ): string {
    const frontendOrigin = this.resolveAllowedOrigin(requestOrigin)
    return this.stateService.signConnectTicket({ userId, frontendOrigin })
  }

  // 티켓을 검증해 사용자를 확인하고, OAuth state를 새로 서명해 Google 인증 URL을 만든다.
  // 쿠키(nonce)는 이 응답을 받은 컨트롤러가 first-party top-level 응답으로 직접 설정해야
  // 서드파티 쿠키 차단에 걸리지 않는다 — 그래서 여기서는 값만 돌려주고 컨트롤러가 쿠키를 심는다.
  buildConnectUrlFromTicket(ticket: string): {
    authUrl: string
    nonce: string
  } {
    const { userId, frontendOrigin } =
      this.stateService.verifyConnectTicket(ticket)
    const { state, nonce } = this.stateService.sign({ userId, frontendOrigin })

    const client = this.createOAuthClient()
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      // 재연결 시에도 refresh_token을 매번 새로 받기 위해 항상 동의 화면을 다시 띄운다.
      prompt: 'consent',
      scope: OAUTH_SCOPES,
      state,
    })

    return { authUrl, nonce }
  }

  // OAuth 콜백에서 code/state/브라우저 쿠키 nonce를 처리하고, 연결된 채널 이름과 결과를
  // 알려줄 프론트엔드 origin을 반환한다.
  async handleCallback(
    code: string,
    state: string,
    cookieNonce: string | undefined,
  ): Promise<{
    userId: string
    channelTitle: string | null
    frontendOrigin: string
  }> {
    const { userId, frontendOrigin } = this.stateService.verify({
      state,
      cookieNonce,
    })

    const client = this.createOAuthClient()
    const { tokens } = await client.getToken(code)
    if (!tokens.refresh_token || !tokens.access_token) {
      throw new UnauthorizedException(
        'YouTube 인증에 필요한 토큰을 받지 못했어요. 다시 시도해 주세요.',
      )
    }

    const channel = await this.fetchOwnChannel(tokens.access_token)

    await this.connectionService.upsert({
      userId,
      youtubeChannelId: channel.channelId,
      channelTitle: channel.title,
      channelThumbnailUrl: channel.thumbnailUrl,
      refreshTokenEncrypted: this.tokenEncryptionService.encrypt(
        tokens.refresh_token,
      ),
      accessTokenEncrypted: this.tokenEncryptionService.encrypt(
        tokens.access_token,
      ),
      tokenExpiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    })

    return { userId, channelTitle: channel.title, frontendOrigin }
  }

  listConnections(userId: string): Promise<YoutubeConnectionSummary[]> {
    return this.connectionService.listForUser(userId)
  }

  // Google 쪽 refresh token revoke는 하지 않는다 — 같은 Google 계정으로 연결된 다른
  // youtube_connections 채널의 토큰까지 함께 무효화될 수 있어, 채널 단위 연결 해제와 맞지
  // 않는다(전체 권한 철회는 별도 기능/정책이 정해지면 그때 구현한다). 여기서는 로컬 연결
  // 행만 REVOKED로 표시한다.
  async disconnect(userId: string, connectionId: string): Promise<void> {
    await this.connectionService.getOwnedById(userId, connectionId)
    await this.connectionService.markDisconnected(connectionId)
  }

  // 콜백 처리가 code/state 검증 단계에서 실패했을 때 결과 팝업을 어느 origin으로 보낼지
  // 고르는 용도. state 안의 frontendOrigin은 서명 검증 전이라 그대로 믿지 않고, 반드시
  // 허용 목록과 대조한 값만 쓴다.
  resolveNotifyOrigin(state: string | undefined): string {
    const claimed = state
      ? this.stateService.peekUnverifiedFrontendOrigin(state)
      : null
    if (claimed && this.allowedOrigins().includes(claimed)) {
      return claimed
    }
    return this.primaryFrontendOrigin()
  }

  private async fetchOwnChannel(
    accessToken: string,
  ): Promise<YoutubeChannelInfo> {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (!response.ok) {
      throw new Error(
        `YouTube 채널 조회에 실패했어요. (status=${response.status})`,
      )
    }

    const body = (await response.json()) as {
      items?: Array<{
        id: string
        snippet?: {
          title?: string
          thumbnails?: { default?: { url?: string } }
        }
      }>
    }
    const item = body.items?.[0]
    if (!item) {
      throw new Error('연결할 YouTube 채널을 찾지 못했어요.')
    }

    return {
      channelId: item.id,
      title: item.snippet?.title ?? null,
      thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? null,
    }
  }

  private resolveAllowedOrigin(requestOrigin: string | undefined): string {
    if (requestOrigin && this.allowedOrigins().includes(requestOrigin)) {
      return requestOrigin
    }
    return this.primaryFrontendOrigin()
  }

  private allowedOrigins(): string[] {
    const devOrigin = this.configService.get<string>('FRONTEND_DEV_ORIGIN')
    return [this.primaryFrontendOrigin(), devOrigin].filter(
      (origin): origin is string => Boolean(origin),
    )
  }

  private primaryFrontendOrigin(): string {
    return this.configService.getOrThrow<string>('FRONTEND_ORIGIN')
  }

  private createOAuthClient(): OAuth2Client {
    return new OAuth2Client(
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.getOrThrow<string>('YOUTUBE_REDIRECT_URI'),
    )
  }
}
