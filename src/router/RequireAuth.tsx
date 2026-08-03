import { Navigate, Outlet } from 'react-router-dom'
import { useSupabaseSession } from '../hooks/useSupabaseSession'

// 홈은 비로그인 상태에서도 접근 가능한 로그인 시작점이라 이 가드 밖에 둔다.
// 그 외 만들기/라이브러리/마이페이지는 이 가드를 통과해야 한다(spec 5.1/5.2, 2026-08-03 갱신).
function RequireAuth() {
  const { session, isLoading } = useSupabaseSession()

  if (isLoading) {
    return null
  }

  if (!session) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export default RequireAuth
