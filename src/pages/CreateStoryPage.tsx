import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import youtubeIcon from '../assets/platforms/youtube.png'
import tiktokIcon from '../assets/platforms/tiktok.png'
import instagramIcon from '../assets/platforms/instagram.png'
import styles from './CreateStoryPage.module.scss'

const SUPPORTED_PLATFORMS = [
  { name: 'YouTube', icon: youtubeIcon },
  { name: 'TikTok', icon: tiktokIcon },
  { name: 'Instagram', icon: instagramIcon },
]

function CreateStoryPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.createStory}>
      <h1 className={styles.heading}>어떤 콘텐츠를 만들까요?</h1>
      <div className={styles.cards}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>AI 동물 숏폼</p>
          <p className={styles.cardDescription}>
            {'일관된 캐릭터와 세계관을 활용해 새로운 이야기를 만들거나\n이전 이야기를 이어보세요.'}
          </p>
          <div className={styles.platforms}>
            <p className={styles.platformsLabel}>지원 플랫폼</p>
            <div className={styles.platformsList}>
              {SUPPORTED_PLATFORMS.map((platform) => (
                <div key={platform.name} className={styles.platformItem}>
                  <img className={styles.platformIcon} src={platform.icon} alt="" />
                  <p className={styles.platformName}>{platform.name}</p>
                </div>
              ))}
            </div>
          </div>
          <Button type="button" variant="primary" onClick={() => navigate('/create/story/setup')}>
            이 템플릿 사용하기 →
          </Button>
        </div>
        <div className={[styles.card, styles.cardComingSoon].join(' ')}>
          <p className={styles.cardTitleMuted}>곧 만나요!</p>
          <Button type="button" disabled>
            준비 중
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateStoryPage
