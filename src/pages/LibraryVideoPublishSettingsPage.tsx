import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import ChevronDownIcon from '../components/common/ChevronDownIcon/ChevronDownIcon'
import { AlertPopup } from '../components/common/Popup'
import type { VideoStatus } from '../components/common/StatusBadge/StatusBadge'
import styles from './LibraryVideoPublishSettingsPage.module.scss'

type PublishMode = 'now' | 'scheduled'

const AUDIENCE_LABELS: Record<string, string> = {
  '': '선택해 주세요.',
  all: '전체 이용가',
  kids: '아동용',
}

const EDIT_INITIAL_VALUES = {
  title: '고양이의 느긋한 오후',
  content: '햇살 좋은 오후, 고양이가 창가에서 낮잠을 자는 짧은 이야기예요.',
  audience: '',
  publishMode: 'scheduled' as PublishMode,
  scheduledAt: '2026-07-28T18:00',
}

function LibraryVideoPublishSettingsPage() {
  const navigate = useNavigate()
  const { videoId } = useParams()
  const location = useLocation()
  const status = (location.state as { status?: VideoStatus } | null)?.status
  // 게시 완료 상태에서는 이미 게시가 끝나서 공개 범위만 바꿀 수 있고 나머지는 읽기 전용이다.
  const isPublished = status === '게시 완료'

  const [title, setTitle] = useState(EDIT_INITIAL_VALUES.title)
  const [content, setContent] = useState(EDIT_INITIAL_VALUES.content)
  const [audience, setAudience] = useState(EDIT_INITIAL_VALUES.audience)
  const [publishMode, setPublishMode] = useState<PublishMode>(EDIT_INITIAL_VALUES.publishMode)
  const [scheduledAt, setScheduledAt] = useState(EDIT_INITIAL_VALUES.scheduledAt)
  const [isDoneAlertOpen, setDoneAlertOpen] = useState(false)

  function handleCancel() {
    navigate(`/library/videos/${videoId}`)
  }

  function handleSubmit() {
    if (!title.trim()) {
      return
    }
    setDoneAlertOpen(true)
  }

  function handleAlertConfirm() {
    setDoneAlertOpen(false)
    navigate(`/library/videos/${videoId}`)
  }

  const alertTitle = isPublished
    ? '공개 설정을 변경했어요.'
    : publishMode === 'scheduled'
      ? '예약이 변경됐어요.'
      : '게시 설정을 변경했어요.'
  const alertDescription = isPublished
    ? '변경한 공개 범위로 적용돼요.'
    : publishMode === 'scheduled'
      ? '변경한 예약 시간에 맞춰 게시돼요.'
      : '변경한 설정으로 다시 게시돼요.'
  const submitLabel = isPublished ? '저장' : publishMode === 'scheduled' ? '예약 변경 완료' : '다시 게시'

  return (
    <div className={styles.page}>
      <AlertPopup isOpen={isDoneAlertOpen} title={alertTitle} description={alertDescription} onConfirm={handleAlertConfirm} />

      <h1 className={styles.title}>{isPublished ? '공개 설정 변경' : '게시 설정 변경'}</h1>

      <div className={styles.form}>
        <div className={styles.row}>
          <p className={styles.label}>제목</p>
          {isPublished ? (
            <p className={styles.readOnlyValue}>{title}</p>
          ) : (
            <input
              type="text"
              className={styles.input}
              placeholder="콘텐츠 제목을 작성해 주세요."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          )}
        </div>

        <div className={styles.row}>
          <p className={styles.label}>게시글 내용</p>
          {isPublished ? (
            <p className={[styles.readOnlyValue, styles.readOnlyTextarea].join(' ')}>{content}</p>
          ) : (
            <textarea
              className={styles.textarea}
              placeholder="게시글 내용을 작성해 주세요."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          )}
        </div>

        <div className={styles.row}>
          <p className={styles.label}>시청자층</p>
          {isPublished ? (
            <p className={styles.readOnlyValue}>{AUDIENCE_LABELS[audience]}</p>
          ) : (
            <div className={styles.selectField}>
              <select className={styles.select} value={audience} onChange={(event) => setAudience(event.target.value)}>
                <option value="">선택해 주세요.</option>
                <option value="all">전체 이용가</option>
                <option value="kids">아동용</option>
              </select>
              <ChevronDownIcon className={styles.selectChevron} />
            </div>
          )}
        </div>

        <div className={styles.row}>
          <p className={styles.label}>공개 범위</p>
          <div className={styles.selectField}>
            <select className={styles.select} defaultValue="public">
              <option value="public">공개</option>
            </select>
            <ChevronDownIcon className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>게시 방식</p>
          {isPublished ? (
            <p className={styles.readOnlyValue}>{publishMode === 'scheduled' ? '예약 게시' : '지금 게시'}</p>
          ) : (
            <div className={styles.selectField}>
              <select
                className={styles.select}
                value={publishMode}
                onChange={(event) => setPublishMode(event.target.value as PublishMode)}
              >
                <option value="now">지금 게시</option>
                <option value="scheduled">예약 게시</option>
              </select>
              <ChevronDownIcon className={styles.selectChevron} />
            </div>
          )}
        </div>

        {!isPublished && publishMode === 'scheduled' && (
          <div className={styles.row}>
            <p className={styles.label}>예약 일시</p>
            <input
              type="datetime-local"
              className={styles.input}
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            취소
          </Button>
          <Button type="button" variant="primary" disabled={!title.trim()} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LibraryVideoPublishSettingsPage
