import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import LibraryTabs from '../components/common/LibraryTabs/LibraryTabs'
import MoreIcon from '../components/common/MoreIcon/MoreIcon'
import GridViewIcon from '../components/common/GridViewIcon/GridViewIcon'
import ListViewIcon from '../components/common/ListViewIcon/ListViewIcon'
import styles from './LibraryCharactersPage.module.scss'

type CharacterCardData = {
  id: string
  name: string
  summary: string
  imageInfo: string
  updatedAt: string
}

const CHARACTERS: CharacterCardData[] = [
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

function LibraryCharactersPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div className={styles.page}>
      <LibraryTabs />

      <div className={styles.header}>
        <p className={styles.description}>저장한 캐릭터를 확인하고 관리할 수 있어요.</p>
        <Button type="button" variant="primary">
          + 새 캐릭터 만들기
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <input type="text" placeholder="캐릭터 이름을 검색해 주세요." />
        </div>
        <button type="button" className={styles.sort}>
          최근 수정순
          <ChevronIcon />
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
          {CHARACTERS.map((character) => (
            <button
              key={character.id}
              type="button"
              className={styles.card}
              onClick={() => navigate(`/library/characters/${character.id}`)}
            >
              <div className={styles.thumbnail}>
                <p className={styles.thumbnailLabel}>캐릭터 대표 이미지</p>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.titleRow}>
                  <p className={styles.cardTitle}>{character.name}</p>
                  <MoreIcon className={styles.cardMore} />
                </div>
                <p className={styles.cardMeta}>{character.summary}</p>
                <p className={styles.cardMeta}>
                  {character.imageInfo} · {character.updatedAt} 수정
                </p>
              </div>
            </button>
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
          {CHARACTERS.map((character) => (
            <button
              key={character.id}
              type="button"
              className={styles.tableRow}
              onClick={() => navigate(`/library/characters/${character.id}`)}
            >
              <span className={styles.colImage}>
                <span className={styles.rowImage}>이미지</span>
              </span>
              <span className={[styles.colName, styles.rowName].join(' ')}>{character.name}</span>
              <span className={styles.colInfo}>{character.summary}</span>
              <span className={styles.colImageInfo}>{character.imageInfo}</span>
              <span className={styles.colUpdated}>{character.updatedAt}</span>
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

export default LibraryCharactersPage
