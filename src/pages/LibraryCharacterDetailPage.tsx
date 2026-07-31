import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LibraryDetailHeader from '../components/common/LibraryDetailHeader/LibraryDetailHeader'
import DetailField from '../components/common/DetailField/DetailField'
import InfoCard from '../components/common/InfoCard/InfoCard'
import { RiskConfirmPopup } from '../components/common/Popup'
import styles from './LibraryCharacterDetailPage.module.scss'

const IMAGE_INFO_ITEMS = [
  { label: '대표 이미지', value: '1장' },
  { label: '참고 이미지', value: '3장' },
  { label: '등록 방식', value: '설명으로 만들기' },
  { label: '생성 방식', value: 'AI 생성' },
  { label: '사용 크레딧', value: '8 크레딧' },
]

const MANAGEMENT_ITEMS = [
  { label: '사용 영상', value: '12개' },
  { label: '최근 사용', value: '2026.07.27' },
  { label: '생성일', value: '2026.07.20' },
  { label: '수정일', value: '2026.07.27' },
]

function LibraryCharacterDetailPage() {
  const navigate = useNavigate()
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className={styles.page}>
      <LibraryDetailHeader
        backLabel="← 캐릭터 목록"
        onBack={() => navigate('/library/characters')}
        title="캐릭터 상세"
        onDelete={() => setDeleteOpen(true)}
      />

      <RiskConfirmPopup
        isOpen={isDeleteOpen}
        title="캐릭터를 삭제할까요?"
        description="삭제하면 이후 새 영상 제작에서 이 캐릭터를 다시 선택할 수 없어요. 이미 만든 영상은 그대로 유지돼요."
        confirmLabel="삭제"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => navigate('/library/characters')}
      />

      <div className={styles.content}>
        <div className={styles.images}>
          <p className={styles.sectionLabel}>대표 이미지</p>
          <div className={styles.representativeImage}>
            <p className={styles.representativeImageLabel}>캐릭터 대표 이미지</p>
          </div>
          <p className={styles.sectionLabel}>참고 이미지 (3)</p>
          <div className={styles.referenceImages}>
            <div className={styles.referenceImage}>
              <p className={styles.referenceImageLabel}>참고 이미지 1</p>
            </div>
            <div className={styles.referenceImage}>
              <p className={styles.referenceImageLabel}>참고 이미지 2</p>
            </div>
            <div className={styles.referenceImage}>
              <p className={styles.referenceImageLabel}>참고 이미지 3</p>
            </div>
          </div>
        </div>

        <div className={styles.info}>
          <p className={styles.sectionLabel}>기본 정보</p>
          <div className={styles.fields}>
            <DetailField label="이름" value="김햄찌" />
            <DetailField
              label="캐릭터 설명"
              multiline
              value="통통한 골든 햄스터로 둥근 얼굴과 작은 귀를 가지고 있으며, 항상 흰색 셔츠를 입고 있어요."
            />
            <DetailField label="특징 또는 소품" multiline value="흰색 셔츠, 빨간 넥타이, 왼쪽 귀의 작은 점" />
          </div>
          <div className={styles.cards}>
            <InfoCard title="이미지 정보" items={IMAGE_INFO_ITEMS} />
            <InfoCard title="관리 정보" items={MANAGEMENT_ITEMS} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibraryCharacterDetailPage
