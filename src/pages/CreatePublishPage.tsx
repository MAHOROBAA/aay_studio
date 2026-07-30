import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Stepper from '../components/common/Stepper/Stepper'
import Dropdown from '../components/common/Dropdown/Dropdown'
import InfoCard from '../components/common/InfoCard/InfoCard'
import VideoPreview from '../components/common/VideoPreview/VideoPreview'
import { useCreateFlow } from '../router/createFlow'
import styles from './CreatePublishPage.module.scss'

const VIDEO_INFO_ITEMS = [
  { label: '화면 비율', value: '9:16 세로형' },
  { label: '영상 길이', value: '20초' },
  { label: '해상도', value: '1080p' },
  { label: '오디오', value: '음악 + 효과음' },
  { label: '사용 크레딧', value: '24 크레딧' },
]

const PLATFORM_INFO_ITEMS = [
  { label: '게시 플랫폼', value: 'YouTube' },
  { label: '계정', value: 'io******o@gmail.com' },
]

function CreatePublishPage() {
  const navigate = useNavigate()
  const flow = useCreateFlow()

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>게시 설정</h1>

      {flow === 'free' && <Stepper current={5} />}

      <div className={styles.body}>
        <div className={styles.topRow}>
          <VideoPreview width={300} height={168.75} contentWidth={103} progressPercent={23} />
          <InfoCard title="영상 정보" items={VIDEO_INFO_ITEMS} />
          <InfoCard title="게시 플랫폼 정보" items={PLATFORM_INFO_ITEMS} />
        </div>

        <div className={styles.row}>
          <p className={styles.rowLabel}>제목</p>
          <div className={styles.textareaBox} style={{ height: 38 }}>
            <p className={styles.textareaPlaceholder}>콘텐츠 제목을 작성해 주세요.</p>
          </div>
        </div>

        <div className={[styles.row, styles.rowStart].join(' ')}>
          <p className={[styles.rowLabel, styles.rowLabelStart].join(' ')}>게시글 내용</p>
          <div className={styles.textareaBox}>
            <p className={styles.textareaPlaceholder}>게시글 내용을 작성해 주세요.</p>
          </div>
        </div>

        <div className={styles.metaRow}>
          <Dropdown
            label="시청자층"
            className={styles.narrowField}
            options={[{ label: '선택해 주세요', value: '' }]}
          />
          <Dropdown label="공개 범위" className={styles.narrowField} options={[{ label: '공개', value: 'public' }]} />
          <Dropdown
            label="게시 방식"
            className={styles.narrowField}
            options={[{ label: '지금 게시', value: 'now' }]}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={() => navigate('/create/review', { state: { flow } })}>
          ← 검토로 돌아가기
        </Button>
        <Button type="button" variant="primary">
          게시하기 →
        </Button>
      </div>
    </div>
  )
}

export default CreatePublishPage
