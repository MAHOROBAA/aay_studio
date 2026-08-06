import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import type {
  YoutubeConnectionRow,
  YoutubeConnectionSummary,
} from './youtube.types'

type SingleResult = { data: unknown; error: { message: string } | null }
type ListResult = { data: unknown[] | null; error: { message: string } | null }
type UpsertFn = (
  payload: Record<string, unknown>,
  options: { onConflict: string },
) => { select: () => { single: () => Promise<SingleResult> } }
type UpdateFn = (payload: Record<string, unknown>) => {
  eq: (
    column: string,
    value: string,
  ) => Promise<{ error: { message: string } | null }>
}

@Injectable()
export class YoutubeConnectionService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 같은 사용자가 같은 채널을 다시 연결하면(재인증, 재동의) 기존 행을 갱신한다 —
  // unique(user_id, youtube_channel_id) 제약을 그대로 dedup에 활용한다.
  async upsert(params: {
    userId: string
    youtubeChannelId: string
    channelTitle: string | null
    channelThumbnailUrl: string | null
    refreshTokenEncrypted: string
    accessTokenEncrypted: string | null
    tokenExpiresAt: string | null
  }): Promise<YoutubeConnectionRow> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('youtube_connections')
    const upsert = query.upsert.bind(query) as unknown as UpsertFn
    const { data, error } = await upsert(
      {
        user_id: params.userId,
        youtube_channel_id: params.youtubeChannelId,
        channel_title: params.channelTitle,
        channel_thumbnail_url: params.channelThumbnailUrl,
        refresh_token_encrypted: params.refreshTokenEncrypted,
        access_token_encrypted: params.accessTokenEncrypted,
        token_expires_at: params.tokenExpiresAt,
        status: 'ACTIVE',
        connected_at: new Date().toISOString(),
        disconnected_at: null,
      },
      { onConflict: 'user_id,youtube_channel_id' },
    )
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data as YoutubeConnectionRow
  }

  async listForUser(userId: string): Promise<YoutubeConnectionSummary[]> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = (await client
      .from('youtube_connections')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['ACTIVE', 'ERROR'])
      .order('connected_at', { ascending: false })) as ListResult

    if (error) {
      throw new Error(error.message)
    }
    return (data ?? []).map((row) => toSummary(row as YoutubeConnectionRow))
  }

  // 게시 작업(2차 배치)에서 토큰이 필요할 때 쓰는 내부 전용 조회 — 결과를 프론트로 그대로
  // 반환하면 안 된다.
  async getOwnedById(
    userId: string,
    connectionId: string,
  ): Promise<YoutubeConnectionRow> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = await client
      .from('youtube_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }
    if (!data) {
      throw new NotFoundException('연결된 채널을 찾을 수 없습니다.')
    }
    return data
  }

  async markDisconnected(connectionId: string): Promise<void> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('youtube_connections')
    const update = query.update.bind(query) as unknown as UpdateFn
    const { error } = await update({
      status: 'REVOKED',
      disconnected_at: new Date().toISOString(),
    }).eq('id', connectionId)

    if (error) {
      throw new Error(error.message)
    }
  }
}

function toSummary(row: YoutubeConnectionRow): YoutubeConnectionSummary {
  return {
    id: row.id,
    youtubeChannelId: row.youtube_channel_id,
    channelTitle: row.channel_title,
    channelThumbnailUrl: row.channel_thumbnail_url,
    status: row.status,
    connectedAt: row.connected_at,
  }
}
