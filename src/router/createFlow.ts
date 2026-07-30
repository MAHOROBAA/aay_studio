import { useLocation } from 'react-router-dom'

export type CreateFlow = 'story' | 'free'

type CreateFlowLocationState = {
  flow?: CreateFlow
}

export function useCreateFlow(): CreateFlow {
  const location = useLocation()
  const state = location.state as CreateFlowLocationState | null
  return state?.flow === 'free' ? 'free' : 'story'
}
