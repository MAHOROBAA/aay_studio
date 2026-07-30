import Button from '../components/common/Button/Button'
import Stepper from '../components/common/Stepper/Stepper'
import { useCreateFlow } from '../router/createFlow'
import styles from './CreateGeneratingPage.module.scss'

const STATUS_ITEMS = [
  { label: '장면 이미지 생성', done: true },
  { label: '영상 변환', done: true },
  { label: '오디오 적용', done: true },
  { label: '최종 영상 합성', done: false },
]

function CreateGeneratingPage() {
  const flow = useCreateFlow()
  const progressPercent = 12

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
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} className={styles.statusItem}>
              {item.done ? (
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
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.estimate}>
        <p className={styles.estimateLabel}>예상 남은 시간</p>
        <p className={styles.estimateValue}>2분 35초</p>
      </div>

      <p className={styles.hint}>다른 화면으로 이동해도 생성은 계속됩니다.</p>

      <div className={styles.actions}>
        <Button type="button" disabled>
          다음 →
        </Button>
      </div>
    </div>
  )
}

export default CreateGeneratingPage
