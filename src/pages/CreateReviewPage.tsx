import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Stepper from '../components/common/Stepper/Stepper'
import InfoCard from '../components/common/InfoCard/InfoCard'
import VideoPreview from '../components/common/VideoPreview/VideoPreview'
import InsufficientCreditPopup from '../components/common/InsufficientCreditPopup/InsufficientCreditPopup'
import { useCreateGenerationMeta } from '../router/createFlow'
import { CURRENT_CREDIT_BALANCE } from '../mocks/credit'
import { trackCreditInsufficient, trackGenerationRetry, trackReviewCompleted } from '../lib/analytics'
import styles from './CreateReviewPage.module.scss'

const VIDEO_INFO_ITEMS = [
  { label: '게시 플랫폼', value: 'YouTube' },
  { label: '화면 비율', value: '9:16 세로형' },
  { label: '영상 길이', value: '20초' },
  { label: '해상도', value: '1080p' },
  { label: '오디오', value: '음악 + 효과음' },
  { label: '사용 크레딧', value: '24 크레딧' },
]

const REQUIRED_CREDIT = 24

function CreateReviewPage() {
  const navigate = useNavigate()
  const { flow, duration, ratio, retryCount } = useCreateGenerationMeta()
  const briefPath = flow === 'free' ? '/create/free/brief' : '/create/settings'
  const [isInsufficientOpen, setInsufficientOpen] = useState(false)

  function handleRegenerate() {
    if (CURRENT_CREDIT_BALANCE < REQUIRED_CREDIT) {
      trackCreditInsufficient({
        actionType: 'video_creation',
        requiredAmount: REQUIRED_CREDIT,
        balance: CURRENT_CREDIT_BALANCE,
      })
      setInsufficientOpen(true)
      return
    }
    trackGenerationRetry()
    navigate('/create/generating', { state: { flow, duration, ratio, retryCount: retryCount + 1 } })
  }

  function handleReviewCompleted() {
    trackReviewCompleted()
    navigate('/create/publish', { state: { flow, duration, ratio, retryCount } })
  }

  return (
    <div className={styles.page}>
      <InsufficientCreditPopup
        isOpen={isInsufficientOpen}
        requiredCredit={REQUIRED_CREDIT}
        onCancel={() => setInsufficientOpen(false)}
      />
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
        <Button type="button" variant="primary" onClick={handleRegenerate}>
          다시 생성 · 24크레딧
        </Button>
        <Button type="button" variant="primary" onClick={handleReviewCompleted}>
          게시 설정으로 이동 →
        </Button>
      </div>
    </div>
  )
}

export default CreateReviewPage
