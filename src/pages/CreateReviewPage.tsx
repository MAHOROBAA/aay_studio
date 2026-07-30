import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Stepper from '../components/common/Stepper/Stepper'
import InfoCard from '../components/common/InfoCard/InfoCard'
import VideoPreview from '../components/common/VideoPreview/VideoPreview'
import { useCreateFlow } from '../router/createFlow'
import styles from './CreateReviewPage.module.scss'

const VIDEO_INFO_ITEMS = [
  { label: '게시 플랫폼', value: 'YouTube' },
  { label: '화면 비율', value: '9:16 세로형' },
  { label: '영상 길이', value: '20초' },
  { label: '해상도', value: '1080p' },
  { label: '오디오', value: '음악 + 효과음' },
  { label: '사용 크레딧', value: '24 크레딧' },
]

function CreateReviewPage() {
  const navigate = useNavigate()
  const flow = useCreateFlow()
  const briefPath = flow === 'free' ? '/create/free/brief' : '/create/settings'

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Aaaay! 영상이 완성됐어요.</h1>

      {flow === 'free' && <Stepper current={4} />}

      <div className={styles.body}>
        <VideoPreview width={600} height={337.5} contentWidth={206} progressPercent={19} />
        <InfoCard title="영상 정보" items={VIDEO_INFO_ITEMS} />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={() => navigate(briefPath, { state: { flow } })}>
          ← AI 기획 수정
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/create/generating', { state: { flow } })}
        >
          다시 생성 · 24크레딧
        </Button>
        <Button type="button" variant="primary" onClick={() => navigate('/create/publish', { state: { flow } })}>
          게시 설정으로 이동 →
        </Button>
      </div>
    </div>
  )
}

export default CreateReviewPage
