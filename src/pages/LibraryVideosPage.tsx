import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import StatusBadge, { type VideoStatus } from '../components/common/StatusBadge/StatusBadge'
import GridViewIcon from '../components/common/GridViewIcon/GridViewIcon'
import ListViewIcon from '../components/common/ListViewIcon/ListViewIcon'
import FilterDropdown from '../components/common/FilterDropdown/FilterDropdown'
import CardMenu, { type CardMenuItem } from '../components/common/CardMenu/CardMenu'
import DownloadIcon from '../components/common/DownloadIcon/DownloadIcon'
import ClockIcon from '../components/common/ClockIcon/ClockIcon'
import PublishSettingsIcon from '../components/common/PublishSettingsIcon/PublishSettingsIcon'
import TrashIcon from '../components/common/TrashIcon/TrashIcon'
import { RiskConfirmPopup } from '../components/common/Popup'
import { useViewPreference } from '../hooks/useViewPreference'
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

const INITIAL_VIDEOS: VideoCardData[] = [
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

const STATUS_OPTIONS: VideoStatus[] = ['게시 완료', '예약 게시', '게시 실패']
const METHOD_OPTIONS = ['스토리 영상', '자유 영상']

function LibraryVideosPage() {
  const navigate = useNavigate()
  const [view, setView] = useViewPreference('aay.library.videos.view')
  const [videos, setVideos] = useState(INITIAL_VIDEOS)
  const [deleteTarget, setDeleteTarget] = useState<VideoCardData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VideoStatus | ''>('')
  const [methodFilter, setMethodFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  const visibleVideos = useMemo(() => {
    const filtered = videos.filter((video) => {
      if (searchQuery.trim() && !video.title.includes(searchQuery.trim())) {
        return false
      }
      if (statusFilter && video.status !== statusFilter) {
        return false
      }
      if (methodFilter && video.method !== methodFilter) {
        return false
      }
      return true
    })
    return sortOrder === 'oldest' ? [...filtered].reverse() : filtered
  }, [videos, searchQuery, statusFilter, methodFilter, sortOrder])

  const getMenuItems = (video: VideoCardData): CardMenuItem[] => {
    const items: CardMenuItem[] = [{ key: 'download', label: '다운로드', icon: <DownloadIcon />, onSelect: () => {} }]

    if (video.status === '예약 게시') {
      items.push({ key: 'reschedule', label: '예약 변경', icon: <ClockIcon />, onSelect: () => {} })
    } else {
      items.push({ key: 'publish-settings', label: '게시 설정 변경', icon: <PublishSettingsIcon />, onSelect: () => {} })
    }

    items.push({ key: 'delete', label: '삭제', icon: <TrashIcon />, danger: true, onSelect: () => setDeleteTarget(video) })
    return items
  }

  return (
    <div className={styles.page}>
      <LibraryTabs />

      <RiskConfirmPopup
        isOpen={deleteTarget !== null}
        title="영상을 삭제할까요?"
        description="삭제하면 다시 복구할 수 없어요."
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            setVideos((prev) => prev.filter((video) => video.id !== deleteTarget.id))
          }
          setDeleteTarget(null)
        }}
      />

      <div className={styles.header}>
        <p className={styles.description}>AAY로 만든 영상을 확인하고 관리할 수 있어요.</p>
        <Button type="button" variant="primary" onClick={() => navigate('/create')}>
          + 새 영상 만들기
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <input
            type="text"
            placeholder="영상 제목을 검색해 주세요."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <FilterDropdown
          value={statusFilter}
          placeholder="상태 · 전체"
          options={STATUS_OPTIONS.map((status) => ({ label: status, value: status }))}
          onChange={(next) => setStatusFilter(next as VideoStatus | '')}
          triggerClassName={styles.filter}
        />
        <FilterDropdown
          value={methodFilter}
          placeholder="제작 방식 · 전체"
          options={METHOD_OPTIONS.map((method) => ({ label: method, value: method }))}
          onChange={setMethodFilter}
          triggerClassName={styles.filter}
        />
        <FilterDropdown
          value={sortOrder}
          placeholder="최근 생성순"
          includeAllOption={false}
          options={[
            { label: '최근 생성순', value: 'recent' },
            { label: '오래된 순', value: 'oldest' },
          ]}
          onChange={(next) => setSortOrder(next as 'recent' | 'oldest')}
          triggerClassName={[styles.filter, styles.sort].join(' ')}
        />
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

      {visibleVideos.length === 0 ? (
        <p className={styles.emptyState}>검색 결과가 없어요.</p>
      ) : view === 'grid' ? (
        <div className={styles.grid}>
          {visibleVideos.map((video) => (
            <div
              key={video.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/library/videos/${video.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/library/videos/${video.id}`)
                }
              }}
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
                  <CardMenu items={getMenuItems(video)} triggerClassName={styles.cardMore} ariaLabel={`${video.title} 더보기`} />
                </div>
                <p className={styles.cardMeta}>{video.meta}</p>
                <p className={styles.cardDate}>{video.dateLine}</p>
              </div>
            </div>
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
          {visibleVideos.map((video) => (
            <div
              key={video.id}
              className={styles.tableRow}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/library/videos/${video.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/library/videos/${video.id}`)
                }
              }}
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
              <span className={styles.colPublish}>{video.status === '게시 실패' ? '다시 시도해 주세요' : video.dateLine}</span>
              <span className={styles.colMore}>
                <CardMenu items={getMenuItems(video)} triggerClassName={styles.rowMore} ariaLabel={`${video.title} 더보기`} />
              </span>
            </div>
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
