import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import LibraryListRow from '../components/common/LibraryListRow/LibraryListRow'
import EditIcon from '../components/common/EditIcon/EditIcon'
import TrashIcon from '../components/common/TrashIcon/TrashIcon'
import { RiskConfirmPopup } from '../components/common/Popup'
import styles from './LibraryWorldsPage.module.scss'

type WorldRowData = {
  id: string
  name: string
  authorType: string
  summary: string
  characterCount: number
  videoCount: number
  updatedAt: string
}

const INITIAL_WORLDS: WorldRowData[] = [
  {
    id: 'w1',
    name: '햄찌네 회사생활',
    authorType: '사용자 작성',
    summary: '작은 동물들이 사람들과 함께 일하는 평범한 회사. 체구 차이에서 생기는 일상이 펼쳐져요.',
    characterCount: 4,
    videoCount: 12,
    updatedAt: '2026.07.27',
  },
  {
    id: 'w2',
    name: '숲속 마을의 느긋한 하루',
    authorType: 'AI 추천',
    summary: '숲속 동물들이 작은 마을을 이루고 계절에 따라 살아가는 따뜻한 세계관이에요.',
    characterCount: 3,
    videoCount: 8,
    updatedAt: '2026.07.26',
  },
  {
    id: 'w3',
    name: '고양이 탐정 사무소',
    authorType: '사용자 작성',
    summary: '도시의 사건을 해결하는 고양이 탐정과 조수들의 유쾌한 추리 세계관이에요.',
    characterCount: 2,
    videoCount: 5,
    updatedAt: '2026.07.24',
  },
  {
    id: 'w4',
    name: '작은 용들의 마법 학교',
    authorType: 'AI 추천',
    summary: '아직 불을 제대로 뿜지 못하는 아기 용들이 마법을 배우는 학교 이야기예요.',
    characterCount: 6,
    videoCount: 3,
    updatedAt: '2026.07.22',
  },
  {
    id: 'w5',
    name: '달빛 아래 빵집',
    authorType: '사용자 작성',
    summary: '밤에만 문을 여는 빵집에서 손님들의 고민을 해결해 주는 판타지 세계관이에요.',
    characterCount: 3,
    videoCount: 4,
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

function LibraryWorldsPage() {
  const navigate = useNavigate()
  const [worlds, setWorlds] = useState(INITIAL_WORLDS)
  const [deleteTarget, setDeleteTarget] = useState<WorldRowData | null>(null)

  return (
    <div className={styles.page}>
      <LibraryTabs />

      <RiskConfirmPopup
        isOpen={deleteTarget !== null}
        title="세계관을 삭제할까요?"
        description="삭제하면 연결된 스토리와의 연결 정보가 함께 해제돼요. 이미 만든 영상은 그대로 유지돼요."
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            setWorlds((prev) => prev.filter((world) => world.id !== deleteTarget.id))
          }
          setDeleteTarget(null)
        }}
      />

      <div className={styles.header}>
        <p className={styles.description}>저장한 세계관을 확인하고 관리할 수 있어요.</p>
        <Button type="button" variant="primary" onClick={() => navigate('/library/worlds/new')}>
          + 새 세계관 만들기
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <input type="text" placeholder="세계관 이름을 검색해 주세요." />
        </div>
        <button type="button" className={styles.filter}>
          작성 방식 · 전체
          <ChevronIcon />
        </button>
        <button type="button" className={[styles.filter, styles.sort].join(' ')}>
          최근 수정순
          <ChevronIcon />
        </button>
      </div>

      <div className={styles.list}>
        {worlds.map((world) => (
          <LibraryListRow
            key={world.id}
            title={world.name}
            badgeLabel={world.authorType}
            description={world.summary}
            metadataItems={[`캐릭터 ${world.characterCount}명`, `영상 ${world.videoCount}개`, world.updatedAt]}
            onClick={() => navigate(`/library/worlds/${world.id}`)}
            menuItems={[
              { key: 'edit', label: '수정', icon: <EditIcon />, onSelect: () => {} },
              { key: 'delete', label: '삭제', icon: <TrashIcon />, danger: true, onSelect: () => setDeleteTarget(world) },
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

export default LibraryWorldsPage
