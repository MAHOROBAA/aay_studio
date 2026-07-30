import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import StatusBadge, { type VideoStatus } from '../components/common/StatusBadge/StatusBadge'
import MoreIcon from '../components/common/MoreIcon/MoreIcon'
import GridViewIcon from '../components/common/GridViewIcon/GridViewIcon'
import ListViewIcon from '../components/common/ListViewIcon/ListViewIcon'
import ChevronDownIcon from '../components/common/ChevronDownIcon/ChevronDownIcon'
import styles from './LibraryVideosPage.module.scss'

type VideoCardData = {
  id: string
  status: VideoStatus
  method: string
  ratio: '16:9' | '9:16'
  durationSeconds: string
  badgeDuration: string
  title: string
  meta: string
  dateLine: string
  progressPercent?: number
}

const VIDEOS: VideoCardData[] = [
  {
    id: 'v1',
    status: '게시 완료',
    method: '자유 영상',
    ratio: '16:9',
    durationSeconds: '20초',
    badgeDuration: '00:20',
    title: '고양이의 느긋한 오후',
    meta: '자유 영상 · 16:9 · 20초',
    dateLine: '2026.07.27 게시',
  },
  {
    id: 'v2',
    status: '예약 게시',
    method: '스토리 영상',
    ratio: '9:16',
    durationSeconds: '20초',
    badgeDuration: '00:20',
    title: '햄스터의 첫 출근',
    meta: '스토리 영상 · 9:16 · 20초',
    dateLine: '2026.07.28 오후 6:00 게시 예정',
  },
  {
    id: 'v3',
    status: '게시 완료',
    method: '자유 영상',
    ratio: '16:9',
    durationSeconds: '30초',
    badgeDuration: '00:30',
    title: '비 오는 날의 작은 모험',
    meta: '자유 영상 · 16:9 · 30초',
    dateLine: '2026.07.25 게시',
  },
  {
    id: 'v4',
    status: '게시 실패',
    method: '자유 영상',
    ratio: '16:9',
    durationSeconds: '20초',
    badgeDuration: '00:20',
    title: '강아지의 여름 산책',
    meta: '자유 영상 · 16:9 · 20초',
    dateLine: '게시 실패 · 다시 시도해 주세요.',
    progressPercent: 68,
  },
  {
    id: 'v5',
    status: '예약 게시',
    method: '스토리 영상',
    ratio: '9:16',
    durationSeconds: '20초',
    badgeDuration: '00:20',
    title: '숲속 친구들의 저녁 식사',
    meta: '스토리 영상 · 9:16 · 20초',
    dateLine: '2026.07.28 오후 6:00 게시 예정',
  },
  {
    id: 'v6',
    status: '게시 실패',
    method: '자유 영상',
    ratio: '16:9',
    durationSeconds: '30초',
    badgeDuration: '00:30',
    title: '작은 여우의 도시 여행',
    meta: '자유 영상 · 16:9 · 30초',
    dateLine: '게시 실패 · 다시 시도해 주세요.',
    progressPercent: 68,
  },
]

function LibraryVideosPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'grid' | 'list'>('grid')

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
          <ChevronDownIcon className={styles.filterChevron} />
        </button>
        <button type="button" className={styles.filter}>
          제작 방식 · 전체
          <ChevronDownIcon className={styles.filterChevron} />
        </button>
        <button type="button" className={[styles.filter, styles.sort].join(' ')}>
          최근 생성순
          <ChevronDownIcon className={styles.filterChevron} />
        </button>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={[styles.viewButton, view === 'grid' ? styles.viewButtonActive : ''].join(' ')}
            aria-label="카드 보기"
            onClick={() => setView('grid')}
          >
            <GridViewIcon />
          </button>
          <button
            type="button"
            className={[styles.viewButton, view === 'list' ? styles.viewButtonActive : ''].join(' ')}
            aria-label="목록 보기"
            onClick={() => setView('list')}
          >
            <ListViewIcon />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
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
                <span className={styles.duration}>{video.badgeDuration}</span>
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
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colPreview}>미리보기</span>
            <span className={styles.colTitle}>영상 제목</span>
            <span className={styles.colMethod}>제작 방식</span>
            <span className={styles.colFormat}>형식</span>
            <span className={styles.colStatus}>상태</span>
            <span className={styles.colPublish}>게시 정보</span>
            <span className={styles.colMore} />
          </div>
          {VIDEOS.map((video) => (
            <button
              key={video.id}
              type="button"
              className={styles.tableRow}
              onClick={() => navigate(`/library/videos/${video.id}`)}
            >
              <span className={styles.colPreview}>
                <span className={styles.rowThumbnail}>{video.ratio}</span>
              </span>
              <span className={[styles.colTitle, styles.rowTitle].join(' ')}>{video.title}</span>
              <span className={styles.colMethod}>{video.method}</span>
              <span className={styles.colFormat}>
                {video.ratio} · {video.durationSeconds}
              </span>
              <span className={[styles.colStatus, styles.rowStatus].join(' ')}>{video.status}</span>
              <span className={styles.colPublish}>{video.dateLine}</span>
              <span className={styles.colMore}>
                <MoreIcon className={styles.rowMore} />
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.loadMore}>
        <Button type="button" variant="secondary">
          더보기
        </Button>
      </div>
    </div>
  )
}

export default LibraryVideosPage
