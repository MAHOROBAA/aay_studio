import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OAuth2Client } from 'google-auth-library'
import type { Request } from 'express'

// Cloud Tasks가 Worker 엔드포인트를 호출할 때 붙이는 OIDC 토큰을 검증한다.
// Cloud Run 자체의 "인증 필요" 설정은 쓰지 않는다(같은 서비스에 프론트가 쓰는 공개 라우트가
// 함께 있어서 서비스 전체를 IAM으로 잠글 수 없음) — 그래서 이 앱 레벨 검증이 유일한 접근 통제다.
// 경로를 숨기는 것 자체는 보안 수단으로 취급하지 않는다.
@Injectable()
export class CloudTasksAuthGuard implements CanActivate {
  private readonly client = new OAuth2Client()

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = extractBearerToken(request.headers.authorization)
    if (!token) {
      throw new UnauthorizedException('OIDC 토큰이 필요합니다.')
    }

    const serviceUrl = this.configService.getOrThrow<string>(
      'CLOUD_RUN_SERVICE_URL',
    )
    // audience는 Cloud Tasks가 토큰을 발급할 때 넣은 값과 정확히 같아야 한다(CloudTasksService에서
    // 각 task의 대상 URL 전체를 audience로 지정함) — 서비스 기본 URL이 아니라 요청 경로까지 포함한
    // 전체 URL을 기준으로 검증한다.
    const expectedAudience = `${serviceUrl}${request.originalUrl}`
    const expectedServiceAccountEmail = this.configService.getOrThrow<string>(
      'CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL',
    )

    const payload = await this.verifyToken(token, expectedAudience)
    if (
      !payload ||
      payload.email !== expectedServiceAccountEmail ||
      !payload.email_verified
    ) {
      throw new UnauthorizedException('허용되지 않은 호출자입니다.')
    }

    return true
  }

  private async verifyToken(token: string, audience: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience,
      })
      return ticket.getPayload()
    } catch {
      throw new UnauthorizedException('유효하지 않은 OIDC 토큰입니다.')
    }
  }
}

function extractBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null
  }
  return authorizationHeader.slice('Bearer '.length).trim() || null
}
