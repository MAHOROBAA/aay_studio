import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import GridViewIcon from '../components/common/GridViewIcon/GridViewIcon'
import ListViewIcon from '../components/common/ListViewIcon/ListViewIcon'
import FilterDropdown from '../components/common/FilterDropdown/FilterDropdown'
import CardMenu, { type CardMenuItem } from '../components/common/CardMenu/CardMenu'
import EditIcon from '../components/common/EditIcon/EditIcon'
import TrashIcon from '../components/common/TrashIcon/TrashIcon'
import { RiskConfirmPopup, AlertPopup } from '../components/common/Popup'
import CharacterCreatePopup, { type NewCharacter } from '../components/common/CharacterCreatePopup/CharacterCreatePopup'
import { useViewPreference } from '../hooks/useViewPreference'
import styles from './LibraryCharactersPage.module.scss'

type CharacterCardData = {
  id: string
  name: string
  summary: string
  imageInfo: string
  updatedAt: string
}

const INITIAL_CHARACTERS: CharacterCardData[] = [
  {
    id: 'c1',
    name: '김햄찌',
    summary: '동글동글 골든 햄스터 · 흰 셔츠 · 빨간 넥타이',
    imageInfo: '참고 이미지 3장',
    updatedAt: '2026.07.27',
  },
  {
    id: 'c2',
    name: '진주씨',
    summary: '검은 단발머리 · 베이지색 셔츠',
    imageInfo: '참고 이미지 2장',
    updatedAt: '2026.07.26',
  },
  {
    id: 'c3',
    name: '팀장님',
    summary: '짙은 회색 정장 · 붉은 넥타이',
    imageInfo: '대표 이미지 1장',
    updatedAt: '2026.07.24',
  },
  {
    id: 'c4',
    name: '모카',
    summary: '갈색 푸들 · 파란색 스카프',
    imageInfo: '참고 이미지 3장',
    updatedAt: '2026.07.22',
  },
  {
    id: 'c5',
    name: '콩이',
    summary: '둥근 얼굴의 흰 토끼 · 노란 가방',
    imageInfo: '참고 이미지 2장',
    updatedAt: '2026.07.20',
  },
  {
    id: 'c6',
    name: '리오',
    summary: '주황빛 작은 여우 · 초록색 후드',
    imageInfo: '대표 이미지 1장',
    updatedAt: '2026.07.18',
  },
]

function LibraryCharactersPage() {
  const navigate = useNavigate()
  const [view, setView] = useViewPreference('aay.library.characters.view')
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS)
  const [deleteTarget, setDeleteTarget] = useState<CharacterCardData | null>(null)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isCreatedAlertOpen, setCreatedAlertOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  function handleCreateCharacter(character: NewCharacter) {
    setCharacters((prev) => [
      { id: `c-${Date.now()}`, name: character.name, summary: character.summary, imageInfo: character.imageInfo, updatedAt: '2026.07.31' },
      ...prev,
    ])
    setCreateOpen(false)
    setCreatedAlertOpen(true)
  }

  const visibleCharacters = useMemo(() => {
    const filtered = characters.filter(
      (character) => !searchQuery.trim() || character.name.includes(searchQuery.trim()),
    )
    return sortOrder === 'oldest' ? [...filtered].reverse() : filtered
  }, [characters, searchQuery, sortOrder])

  const getMenuItems = (character: CharacterCardData): CardMenuItem[] => [
    { key: 'edit', label: '수정', icon: <EditIcon />, onSelect: () => {} },
    { key: 'delete', label: '삭제', icon: <TrashIcon />, danger: true, onSelect: () => setDeleteTarget(character) },
  ]

  return (
    <div className={styles.page}>
      <LibraryTabs />

      <RiskConfirmPopup
        isOpen={deleteTarget !== null}
        title="캐릭터를 삭제할까요?"
        description="삭제하면 이후 새 영상 제작에서 이 캐릭터를 다시 선택할 수 없어요. 이미 만든 영상은 그대로 유지돼요."
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            setCharacters((prev) => prev.filter((character) => character.id !== deleteTarget.id))
          }
          setDeleteTarget(null)
        }}
      />

      <CharacterCreatePopup isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateCharacter} />

      <AlertPopup
        isOpen={isCreatedAlertOpen}
        title="캐릭터를 만들었어요."
        description="새로 만든 캐릭터가 목록 맨 앞에 추가됐어요."
        onConfirm={() => setCreatedAlertOpen(false)}
      />

      <div className={styles.header}>
        <p className={styles.description}>저장한 캐릭터를 확인하고 관리할 수 있어요.</p>
        <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
          + 새 캐릭터 만들기
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <input
            type="text"
            placeholder="캐릭터 이름을 검색해 주세요."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <FilterDropdown
          value={sortOrder}
          placeholder="최근 수정순"
          includeAllOption={false}
          options={[
            { label: '최근 수정순', value: 'recent' },
            { label: '오래된 순', value: 'oldest' },
          ]}
          onChange={(next) => setSortOrder(next as 'recent' | 'oldest')}
          triggerClassName={styles.sort}
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

      {visibleCharacters.length === 0 ? (
        <p className={styles.emptyState}>검색 결과가 없어요.</p>
      ) : view === 'grid' ? (
        <div className={styles.grid}>
          {visibleCharacters.map((character) => (
            <div
              key={character.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/library/characters/${character.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/library/characters/${character.id}`)
                }
              }}
            >
              <div className={styles.thumbnail}>
                <p className={styles.thumbnailLabel}>캐릭터 대표 이미지</p>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.titleRow}>
                  <p className={styles.cardTitle}>{character.name}</p>
                  <CardMenu items={getMenuItems(character)} triggerClassName={styles.cardMore} ariaLabel={`${character.name} 더보기`} />
                </div>
                <p className={styles.cardMeta}>{character.summary}</p>
                <p className={styles.cardMeta}>
                  {character.imageInfo} · {character.updatedAt} 수정
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colImage}>대표 이미지</span>
            <span className={styles.colName}>캐릭터명</span>
            <span className={styles.colInfo}>캐릭터 정보</span>
            <span className={styles.colImageInfo}>이미지 정보</span>
            <span className={styles.colUpdated}>최종 수정일</span>
            <span className={styles.colMore} />
          </div>
          {visibleCharacters.map((character) => (
            <div
              key={character.id}
              className={styles.tableRow}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/library/characters/${character.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/library/characters/${character.id}`)
                }
              }}
            >
              <span className={styles.colImage}>
                <span className={styles.rowImage}>이미지</span>
              </span>
              <span className={[styles.colName, styles.rowName].join(' ')}>{character.name}</span>
              <span className={styles.colInfo}>{character.summary}</span>
              <span className={styles.colImageInfo}>{character.imageInfo}</span>
              <span className={styles.colUpdated}>{character.updatedAt}</span>
              <span className={styles.colMore}>
                <CardMenu items={getMenuItems(character)} triggerClassName={styles.rowMore} ariaLabel={`${character.name} 더보기`} />
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

export default LibraryCharactersPage
