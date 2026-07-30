import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Dropdown from '../components/common/Dropdown/Dropdown'
import Stepper from '../components/common/Stepper/Stepper'
import styles from './CreateManualPage.module.scss'

function CreateManualPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.heading}>멋진 콘텐츠를 만들어보세요!</h1>
        <Stepper current={1} />

        <div className={styles.form}>
          <div className={[styles.row, styles.rowStart].join(' ')}>
            <p className={[styles.rowLabel, styles.rowLabelStart].join(' ')}>요청 내용</p>
            <div className={styles.textareaBox}>
              <p className={styles.textareaPlaceholder}>만들고 싶은 콘텐츠를 설명해주세요...</p>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>게시 플랫폼</p>
            <div className={styles.platformField}>
              <div className={styles.platformRow}>
                <button type="button" className={styles.platformSelect}>
                  <span className={styles.platformSelectText}>
                    YouTube
                    <span className={styles.platformBadge}>연결 안 됨</span>
                  </span>
                  <svg className={styles.chevron} viewBox="0 0 13.3333 13.3333" fill="none" aria-hidden="true">
                    <path
                      d="M9.8313 5.08433L6.66666 8.24904L3.50195 5.08433"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button type="button" className={styles.connectButton}>
                  연결
                </button>
              </div>
              <p className={styles.platformHint}>게시 전에 연결할 수 있습니다.</p>
            </div>
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>화면 비율</p>
            <Dropdown
              label="화면 비율"
              hideLabel
              className={styles.select}
              options={[{ label: '16:9', value: '16:9' }]}
            />
          </div>

          <div className={styles.row}>
            <p className={styles.rowLabel}>영상 길이</p>
            <Dropdown
              label="영상 길이"
              hideLabel
              className={styles.select}
              options={[{ label: '20초', value: '20' }]}
            />
          </div>
        </div>

        <p className={styles.estimate}>예상: 24크레딧 · 약 2~4분</p>

        <div className={styles.actions}>
          <Button type="button" variant="primary" onClick={() => navigate('/create/manual/brief')}>
            다음 →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateManualPage
