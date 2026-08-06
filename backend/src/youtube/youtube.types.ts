export type YoutubeConnectionStatus = 'ACTIVE' | 'REVOKED' | 'ERROR'

export type YoutubeConnectionRow = {
  id: string
  user_id: string
  youtube_channel_id: string
  channel_title: string | null
  channel_thumbnail_url: string | null
  refresh_token_encrypted: string
  access_token_encrypted: string | null
  token_expires_at: string | null
  status: YoutubeConnectionStatus
  connected_at: string
  disconnected_at: string | null
  created_at: string
  updated_at: string
}

// 프론트엔드로 내려가는 안전한 필드만 담은 응답 — 토큰 컬럼은 절대 포함하지 않는다.
export type YoutubeConnectionSummary = {
  id: string
  youtubeChannelId: string
  channelTitle: string | null
  channelThumbnailUrl: string | null
  status: YoutubeConnectionStatus
  connectedAt: string
}

export type YoutubeChannelInfo = {
  channelId: string
  title: string | null
  thumbnailUrl: string | null
}
