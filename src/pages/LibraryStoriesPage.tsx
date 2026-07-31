import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import LibraryListRow from '../components/common/LibraryListRow/LibraryListRow'
import EditIcon from '../components/common/EditIcon/EditIcon'
import TrashIcon from '../components/common/TrashIcon/TrashIcon'
import { RiskConfirmPopup } from '../components/common/Popup'
import styles from './LibraryStoriesPage.module.scss'

type StoryRowData = {
  id: string
  title: string
  storyType: string
  summary: string
  worldName: string
  characterCount: number
  videoCount: number
  updatedAt: string
}

const INITIAL_STORIES: StoryRowData[] = [
  {
    id: 's1',
    title: '김햄찌의 첫 출근',
    storyType: '단편',
    summary: '처음 회사에 출근한 김햄찌가 거대한 사무용품 사이에서 자기 자리를 찾아가는 이야기예요.',
    worldName: '햄찌네 회사생활',
    characterCount: 3,
    videoCount: 1,
    updatedAt: '2026.07.27',
  },
  {
    id: 's2',
    title: '사라진 점심 도시락',
    storyType: '이어지는 이야기',
    summary: '점심시간 직전 사라진 도시락을 찾기 위해 김햄찌와 진주씨가 사무실을 조사해요.',
    worldName: '햄찌네 회사생활',
    characterCount: 3,
    videoCount: 2,
    updatedAt: '2026.07.26',
  },
  {
    id: 's3',
    title: '팀장님의 비밀 회의',
    storyType: '단편',
    summary: '모두가 퇴근한 뒤 홀로 회의실에 들어가는 팀장님을 김햄찌가 몰래 따라가요.',
    worldName: '햄찌네 회사생활',
    characterCount: 2,
    videoCount: 1,
    updatedAt: '2026.07.24',
  },
  {
    id: 's4',
    title: '비 오는 날의 작은 우산',
    storyType: '이어지는 이야기',
    summary: '갑작스러운 비에 곤란해진 김햄찌를 위해 동료들이 작은 우산을 만들어 주는 이야기예요.',
    worldName: '햄찌네 회사생활',
    characterCount: 4,
    videoCount: 2,
    updatedAt: '2026.07.22',
  },
  {
    id: 's5',
    title: '진주씨의 퇴근 작전',
    storyType: '단편',
    summary: '야근을 피하고 싶은 진주씨와 김햄찌가 팀장님의 눈을 피해 퇴근을 준비해요.',
    worldName: '햄찌네 회사생활',
    characterCount: 3,
    videoCount: 1,
    updatedAt: '2026.07.20',
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

function LibraryStoriesPage() {
  const navigate = useNavigate()
  const [stories, setStories] = useState(INITIAL_STORIES)
  const [deleteTarget, setDeleteTarget] = useState<StoryRowData | null>(null)

  return (
    <div className={styles.page}>
      <LibraryTabs />

      <RiskConfirmPopup
        isOpen={deleteTarget !== null}
        title="스토리를 삭제할까요?"
        description="삭제하면 다시 복구할 수 없어요. 이미 만든 영상은 그대로 유지돼요."
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            setStories((prev) => prev.filter((story) => story.id !== deleteTarget.id))
          }
          setDeleteTarget(null)
        }}
      />

      <div className={styles.header}>
        <p className={styles.description}>저장한 스토리를 확인하고 이어서 만들 수 있어요.</p>
        <Button type="button" variant="primary" onClick={() => navigate('/library/stories/new')}>
          + 새 스토리 만들기
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <input type="text" placeholder="스토리 제목을 검색해 주세요." />
        </div>
        <button type="button" className={styles.filter}>
          스토리 유형 · 전체
          <ChevronIcon />
        </button>
        <button type="button" className={[styles.filter, styles.sort].join(' ')}>
          최근 수정순
          <ChevronIcon />
        </button>
      </div>

      <div className={styles.list}>
        {stories.map((story) => (
          <LibraryListRow
            key={story.id}
            title={story.title}
            badgeLabel={story.storyType}
            description={story.summary}
            metadataItems={[story.worldName, `캐릭터 ${story.characterCount}명 · 영상 ${story.videoCount}개`, story.updatedAt]}
            onClick={() => navigate(`/library/stories/${story.id}`)}
            menuItems={[
              { key: 'edit', label: '수정', icon: <EditIcon />, onSelect: () => {} },
              { key: 'delete', label: '삭제', icon: <TrashIcon />, danger: true, onSelect: () => setDeleteTarget(story) },
            ]}
          />
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

export default LibraryStoriesPage
