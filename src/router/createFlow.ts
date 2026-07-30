import { useLocation } from 'react-router-dom'

export type CreateFlow = 'template' | 'manual'

type CreateFlowLocationState = {
  flow?: CreateFlow
}

export function useCreateFlow(): CreateFlow {
  const location = useLocation()
  const state = location.state as CreateFlowLocationState | null
  return state?.flow === 'manual' ? 'manual' : 'template'
}
