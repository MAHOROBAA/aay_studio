import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import { useSupabaseSession } from '../hooks/useSupabaseSession'
import { supabase } from '../lib/supabaseClient'
import styles from './HomePage.module.scss'

const STORY_DESCRIPTION = `원하는 영상 유형을 선택하면
필요한 설정을 순서대로 안내해 드려요.

캐릭터와 세계관은 유지하고,
새로운 이야기를 만들거나
이전 이야기를 이어갈 수 있어요.`

const FREE_DESCRIPTION = `아이디어를 직접 입력하면
AI가 장면 구성과 연출 방향을 기획해 드려요.

결과를 확인하고 수정한 뒤
원하는 플랫폼에 게시할 수 있어요.`

function HomePage() {
  const navigate = useNavigate()
  const { session, isLoading } = useSupabaseSession()

  function handleLogin() {
    void supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    })
  }

  return (
    <div className={styles.home}>
      <h1 className={styles.heading}>원하는 방식대로 콘텐츠를 만들고, 편집하고, 업로드할 수 있어요.</h1>
      <div className={styles.cards}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>스토리 영상</p>
          <p className={styles.cardDescription}>{STORY_DESCRIPTION}</p>
        </div>
        <div className={[styles.card, styles.cardFree].join(' ')}>
          <p className={styles.cardTitle}>자유 영상</p>
          <p className={styles.cardDescription}>{FREE_DESCRIPTION}</p>
        </div>
      </div>
      {!isLoading && (
        <Button type="button" variant="primary" onClick={session ? () => navigate('/create') : handleLogin}>
          {session ? '콘텐츠 만들기 →' : '로그인 또는 회원가입'}
        </Button>
      )}
    </div>
  )
}

export default HomePage
