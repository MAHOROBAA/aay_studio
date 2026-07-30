import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import StatusBadge, { type VideoStatus } from '../components/common/StatusBadge/StatusBadge'
import MoreIcon from '../components/common/MoreIcon/MoreIcon'
import GridViewIcon from '../components/common/GridViewIcon/GridViewIcon'
import ListViewIcon from '../components/common/ListViewIcon/ListViewIcon'
import styles from './LibraryVideosPage.module.scss'

type VideoCardData = {
  id: string
  status: VideoStatus
  ratio: '16:9' | '9:16'
  duration: string
  title: string
  meta: string
  dateLine: string
  progressPercent?: number
}

const VIDEOS: VideoCardData[] = [
  {
    id: 'v1',
    status: '게시 완료',
    ratio: '16:9',
    duration: '00:20',
    title: '고양이의 느긋한 오후',
    meta: '직접 만들기 · 16:9 · 20초',
    dateLine: '2026.07.27 게시',
  },
  {
    id: 'v2',
    status: '예약 게시',
    ratio: '9:16',
    duration: '00:20',
    title: '햄스터의 첫 출근',
    meta: '템플릿 · 9:16 · 20초',
    dateLine: '2026.07.28 오후 6:00 게시 예정',
  },
  {
    id: 'v3',
    status: '게시 완료',
    ratio: '16:9',
    duration: '00:30',
    title: '비 오는 날의 작은 모험',
    meta: '직접 만들기 · 16:9 · 30초',
    dateLine: '2026.07.25 게시',
  },
  {
    id: 'v4',
    status: '게시 실패',
    ratio: '16:9',
    duration: '00:20',
    title: '강아지의 여름 산책',
    meta: '직접 만들기 · 16:9 · 20초',
    dateLine: '게시 실패 · 다시 시도해 주세요.',
    progressPercent: 68,
  },
  {
    id: 'v5',
    status: '예약 게시',
    ratio: '9:16',
    duration: '00:20',
    title: '숲속 친구들의 저녁 식사',
    meta: '템플릿 · 9:16 · 20초',
    dateLine: '2026.07.28 오후 6:00 게시 예정',
  },
  {
    id: 'v6',
    status: '게시 실패',
    ratio: '16:9',
    duration: '00:30',
    title: '작은 여우의 도시 여행',
    meta: '직접 만들기 · 16:9 · 30초',
    dateLine: '게시 실패 · 다시 시도해 주세요.',
    progressPercent: 68,
  },
]

function ChevronIcon() {
  return (
    <svg className={styles.filterChevron} viewBox="0 0 13.3333 13.3333" fill="none" aria-hidden="true">
      <path
        d="M9.8313 5.08433L6.66666 8.24904L3.50195 5.08433"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LibraryVideosPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <LibraryTabs />

      <div className={styles.header}>
        <p className={styles.description}>AAY로 만든 영상을 확인하고 관리할 수 있어요.</p>
        <Button type="button" variant="primary" onClick={() => navigate('/create')}>
          + 새 영상 만들기
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <input type="text" placeholder="영상 제목을 검색해 주세요." />
        </div>
        <button type="button" className={styles.filter}>
          상태 · 전체
          <ChevronIcon />
        </button>
        <button type="button" className={styles.filter}>
          제작 방식 · 전체
          <ChevronIcon />
        </button>
        <button type="button" className={[styles.filter, styles.sort].join(' ')}>
          최근 생성순
          <ChevronIcon />
        </button>
        <div className={styles.viewToggle}>
          <button type="button" className={[styles.viewButton, styles.viewButtonActive].join(' ')} aria-label="카드 보기">
            <GridViewIcon />
          </button>
          <button type="button" className={styles.viewButton} aria-label="목록 보기">
            <ListViewIcon />
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {VIDEOS.map((video) => (
          <button
            key={video.id}
            type="button"
            className={styles.card}
            onClick={() => navigate(`/library/videos/${video.id}`)}
          >
            <div className={styles.thumbnail}>
              <p className={styles.thumbnailLabel}>{video.ratio} 영상 미리보기</p>
              <div className={styles.thumbnailBadge}>
                <StatusBadge status={video.status} />
              </div>
              {video.progressPercent !== undefined && (
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${video.progressPercent}%` }} />
                </div>
              )}
              <span className={styles.duration}>{video.duration}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.titleRow}>
                <p className={styles.cardTitle}>{video.title}</p>
                <MoreIcon className={styles.cardMore} />
              </div>
              <p className={styles.cardMeta}>{video.meta}</p>
              <p className={styles.cardDate}>{video.dateLine}</p>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.loadMore}>
        <Button type="button" variant="secondary">
          더보기
        </Button>
      </div>
    </div>
  )
}

export default LibraryVideosPage
