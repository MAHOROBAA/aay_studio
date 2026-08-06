import { supabase } from './supabaseClient'

export type YoutubeConnectionSummary = {
  id: string
  youtubeChannelId: string
  channelTitle: string | null
  channelThumbnailUrl: string | null
  status: 'ACTIVE' | 'REVOKED' | 'ERROR'
  connectedAt: string
}

type YoutubeOAuthPopupResult = {
  success: boolean
  channelTitle: string | null
}

async function authorizedFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.')
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(`요청이 실패했어요. (status=${response.status})`)
  }
  return response
}

// 짧은 서명 티켓을 받아 "/youtube/connect/start" URL을 만든다. 팝업이 이 URL로 직접
// top-level 이동해야 백엔드가 심는 연결 쿠키가 first-party로 정상 저장된다(cross-origin
// fetch 응답으로 심는 쿠키는 브라우저의 서드파티 쿠키 차단에 걸릴 수 있다).
export async function requestYoutubeConnectStartUrl(): Promise<string> {
  const response = await authorizedFetch('/youtube/connect')
  const body = (await response.json()) as { ticket: string }
  return `${import.meta.env.VITE_API_BASE_URL}/youtube/connect/start?ticket=${encodeURIComponent(body.ticket)}`
}

export async function listYoutubeConnections(): Promise<YoutubeConnectionSummary[]> {
  const response = await authorizedFetch('/youtube/connections')
  return (await response.json()) as YoutubeConnectionSummary[]
}

export async function disconnectYoutubeConnection(connectionId: string): Promise<void> {
  await authorizedFetch(`/youtube/connections/${connectionId}`, { method: 'DELETE' })
}

// startUrl(= "/youtube/connect/start?ticket=...")을 팝업으로 띄우고, 백엔드 콜백이
// 돌려주는 postMessage 결과를 기다린다. 진행 중이던 제작 플로우 화면(Step 상태)을 잃지 않기
// 위해 top-level 리다이렉트 대신 팝업을 쓴다.
export function openYoutubeOAuthPopup(startUrl: string): Promise<YoutubeOAuthPopupResult> {
  return new Promise((resolve) => {
    const popup = window.open(startUrl, 'aay-youtube-oauth', 'width=520,height=680')
    if (!popup) {
      resolve({ success: false, channelTitle: null })
      return
    }

    // 백엔드(Cloud Run)가 콜백 페이지를 서빙하므로, 메시지 발신 origin은 프론트 자신이
    // 아니라 백엔드 origin이어야 한다. 다른 origin이나 이 팝업이 아닌 창에서 온 메시지는 버린다.
    const expectedOrigin = new URL(import.meta.env.VITE_API_BASE_URL).origin

    function finish(result: YoutubeOAuthPopupResult) {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(closedCheckInterval)
      resolve(result)
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== expectedOrigin || event.source !== popup) {
        return
      }
      const data = event.data as { type?: string; success?: boolean; channelTitle?: string | null } | null
      if (data?.type !== 'aay-youtube-oauth-result') {
        return
      }
      finish({ success: Boolean(data.success), channelTitle: data.channelTitle ?? null })
    }

    // 사용자가 동의 화면에서 그냥 창을 닫아버린 경우에도 대기가 끝나도록 확인한다.
    const closedCheckInterval = window.setInterval(() => {
      if (popup.closed) {
        finish({ success: false, channelTitle: null })
      }
    }, 500)

    window.addEventListener('message', handleMessage)
  })
}
