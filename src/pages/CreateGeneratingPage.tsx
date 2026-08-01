import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Stepper from '../components/common/Stepper/Stepper'
import { useCreateGenerationMeta } from '../router/createFlow'
import { CURRENT_CREDIT_BALANCE } from '../mocks/credit'
import { trackCreditSpent, trackVideoCreationCompleted } from '../lib/analytics'
import styles from './CreateGeneratingPage.module.scss'

const REQUIRED_CREDIT = 24

const STATUS_LABELS = ['장면 이미지 생성', '영상 변환', '오디오 적용', '최종 영상 합성']

function CreateGeneratingPage() {
  const navigate = useNavigate()
  const { flow, duration, ratio, retryCount } = useCreateGenerationMeta()
  const [isComplete, setComplete] = useState(false)
  const progressPercent = isComplete ? 100 : 12

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setComplete(true)
      trackVideoCreationCompleted({
        creationMethod: flow,
        duration,
        creditAmount: REQUIRED_CREDIT,
        retryCount,
      })
      trackCreditSpent({
        actionType: 'video_creation',
        creditAmount: REQUIRED_CREDIT,
        balanceAfter: CURRENT_CREDIT_BALANCE - REQUIRED_CREDIT,
      })
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [flow, duration, retryCount])

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Aaaay! 영상을 만들고 있어요.</h1>

      {flow === 'free' && <Stepper current={3} />}

      <div className={styles.progress}>
        <p className={styles.progressLabel}>전체 진행률</p>
        <p className={styles.progressLabel}>{progressPercent}%</p>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className={styles.status}>
        <p className={styles.statusTitle}>현재 작업 상태</p>
        <div className={styles.statusList}>
          {STATUS_LABELS.map((label) => (
            <div key={label} className={styles.statusItem}>
              {isComplete ? (
                <svg className={styles.statusIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
                  <path
                    d="M5 8.2L7 10.2L11 6"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className={[styles.statusIcon, styles.statusIconPending].join(' ')}
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray="30 10"
                  />
                </svg>
              )}
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.estimate}>
        <p className={styles.estimateLabel}>예상 남은 시간</p>
        <p className={styles.estimateValue}>{isComplete ? '0초' : '2분 35초'}</p>
      </div>

      <p className={styles.hint}>다른 화면으로 이동해도 생성은 계속됩니다.</p>

      <div className={styles.actions}>
        <Button
          type="button"
          disabled={!isComplete}
          onClick={() => navigate('/create/review', { state: { flow, duration, ratio, retryCount } })}
        >
          다음 →
        </Button>
      </div>
    </div>
  )
}

export default CreateGeneratingPage
