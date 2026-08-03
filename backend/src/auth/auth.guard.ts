import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { SupabaseService } from '../supabase/supabase.service'
import type { RequestUser } from './auth.types'

export type AuthenticatedRequest = Request & { user: RequestUser }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = extractBearerToken(request.headers.authorization)
    if (!token) {
      throw new UnauthorizedException('로그인이 필요합니다.')
    }

    const admin = this.supabaseService.getAdminClient()
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user?.email) {
      throw new UnauthorizedException('유효하지 않은 인증 정보입니다.')
    }

    const normalizedEmail = authData.user.email.trim().toLowerCase()
    const { data: tester, error: testerError } = await admin
      .from('beta_testers')
      .select('id, email, name, role, status')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (testerError) {
      throw new UnauthorizedException('사용자 확인 중 문제가 발생했습니다.')
    }
    const typedTester = tester as {
      id: string
      email: string
      name: string | null
      role: 'admin' | 'tester'
      status: string
    } | null

    if (!typedTester || typedTester.status !== 'active') {
      throw new ForbiddenException('테스트 참여가 허용되지 않은 계정이에요.')
    }

    request.user = {
      id: authData.user.id,
      email: typedTester.email,
      name: typedTester.name,
      role: typedTester.role,
    }
    return true
  }
}

function extractBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null
  }
  return authorizationHeader.slice('Bearer '.length).trim() || null
}
