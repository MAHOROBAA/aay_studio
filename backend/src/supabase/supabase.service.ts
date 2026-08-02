import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'

type AdminClient = ReturnType<typeof createClient>

@Injectable()
export class SupabaseService {
  private readonly adminClient: AdminClient

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL')
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    )

    // service_role 키를 쓰는 관리자 클라이언트 — RLS를 우회하므로 이 서비스 밖으로 내보내지 않는다.
    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  getAdminClient(): AdminClient {
    return this.adminClient
  }
}
