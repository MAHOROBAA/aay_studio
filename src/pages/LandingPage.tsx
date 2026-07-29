import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.scss'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.landing}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.logo}>AAY</h1>
          <p className={styles.tagline}>AI 자동화, 당신의 방식대로.</p>
        </div>
        <p className={styles.description}>
          캐릭터는 그대로.
          <br />
          새로운 이야기를 만들거나,
          <br />
          이전 이야기를 이어보세요.
        </p>
        <button type="button" className={styles.cta} onClick={() => navigate('/home')}>
          콘텐츠 만들기 →
        </button>
      </div>
    </div>
  )
}

export default LandingPage
