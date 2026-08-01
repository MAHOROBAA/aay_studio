import { useLocation } from 'react-router-dom'

export type CreateFlow = 'story' | 'free'

type CreateFlowLocationState = {
  flow?: CreateFlow
  duration?: string
  ratio?: string
  retryCount?: number
}

function useCreateFlowState(): CreateFlowLocationState {
  const location = useLocation()
  return (location.state as CreateFlowLocationState | null) ?? {}
}

export function useCreateFlow(): CreateFlow {
  return useCreateFlowState().flow === 'free' ? 'free' : 'story'
}

// 생성 중/검토 화면에서 GA4 이벤트에 실어 보낼 값들을 라우터 state로 이어 받는다.
export function useCreateGenerationMeta(): {
  flow: CreateFlow
  duration: string
  ratio: string
  retryCount: number
} {
  const state = useCreateFlowState()
  return {
    flow: state.flow === 'free' ? 'free' : 'story',
    duration: state.duration ?? '20초',
    ratio: state.ratio ?? '16:9 가로형',
    retryCount: state.retryCount ?? 0,
  }
}
