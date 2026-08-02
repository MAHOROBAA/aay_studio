import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Stepper from '../components/common/Stepper/Stepper'
import Dropdown from '../components/common/Dropdown/Dropdown'
import InfoCard from '../components/common/InfoCard/InfoCard'
import VideoPreview from '../components/common/VideoPreview/VideoPreview'
import PublishCompletePopup from '../components/common/PublishCompletePopup/PublishCompletePopup'
import { useCreateFlow } from '../router/createFlow'
import { trackPublishCompleted } from '../lib/analytics'
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

const PUBLISHED_TITLE = '샘플로 입력한 제목입니다.'
const PUBLISHED_CHANNEL_NAME = '마호의유튜브'

function CreatePublishPage() {
  const navigate = useNavigate()
  const flow = useCreateFlow()
  const [isPublishing, setPublishing] = useState(false)
  const [isPublishedAlertOpen, setPublishedAlertOpen] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')

  function handlePublish() {
    setPublishing(true)
    window.setTimeout(() => {
      setPublishing(false)
      setPublishedAlertOpen(true)
      trackPublishCompleted({ platform: 'youtube', publishType: 'immediate' })
    }, 700)
  }

  return (
    <div className={styles.page}>
      <PublishCompletePopup
        isOpen={isPublishedAlertOpen}
        title={postTitle.trim() || PUBLISHED_TITLE}
        channelName={PUBLISHED_CHANNEL_NAME}
        onGoHome={() => navigate('/home')}
      />
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
            <input
              className={styles.textareaField}
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder="콘텐츠 제목을 작성해 주세요."
            />
          </div>
        </div>

        <div className={[styles.row, styles.rowStart].join(' ')}>
          <p className={[styles.rowLabel, styles.rowLabelStart].join(' ')}>게시글 내용</p>
          <div className={styles.textareaBox}>
            <textarea
              className={styles.textareaField}
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder="게시글 내용을 작성해 주세요."
            />
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
        <Button type="button" variant="primary" disabled={isPublishing} onClick={handlePublish}>
          {isPublishing ? '게시 중...' : '게시하기 →'}
        </Button>
      </div>
    </div>
  )
}

export default CreatePublishPage
