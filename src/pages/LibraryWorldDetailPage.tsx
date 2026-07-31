import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LibraryDetailHeader from '../components/common/LibraryDetailHeader/LibraryDetailHeader'
import DetailField from '../components/common/DetailField/DetailField'
import InfoCard from '../components/common/InfoCard/InfoCard'
import { RiskConfirmPopup } from '../components/common/Popup'
import styles from './LibraryWorldDetailPage.module.scss'

const CONNECTION_ITEMS = [
  { label: '연결 캐릭터', value: '4명' },
  { label: '연결 스토리', value: '8개' },
  { label: '사용 영상', value: '12개' },
  { label: '최근 사용', value: '2026.07.27' },
]

const MANAGEMENT_ITEMS = [
  { label: '작성 방식', value: '사용자 작성' },
  { label: '생성일', value: '2026.07.20' },
  { label: '수정일', value: '2026.07.27' },
  { label: '사용 크레딧', value: '4 크레딧' },
]

function LibraryWorldDetailPage() {
  const navigate = useNavigate()
  const { worldId } = useParams()
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className={styles.page}>
      <LibraryDetailHeader
        backLabel="← 세계관 목록"
        onBack={() => navigate('/library/worlds')}
        title="세계관 상세"
        onEdit={() => navigate(`/library/worlds/${worldId}/edit`)}
        onDelete={() => setDeleteOpen(true)}
      />

      <RiskConfirmPopup
        isOpen={isDeleteOpen}
        title="세계관을 삭제할까요?"
        description="삭제하면 연결된 스토리와의 연결 정보가 함께 해제돼요. 이미 만든 영상은 그대로 유지돼요."
        confirmLabel="삭제"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => navigate('/library/worlds')}
      />

      <div className={styles.content}>
        <DetailField label="세계관 이름" value="햄찌네 회사생활" />
        <DetailField
          label="세계관 설명"
          multiline
          value="작은 동물들이 사람들과 함께 일하는 평범한 회사예요. 체구 차이에서 생기는 소소한 사건과 직장 생활을 옴니버스 형식으로 다뤄요."
        />
        <DetailField
          label="시간/공간 설정"
          multiline
          value="현대의 평범한 사무실과 도심. 사람과 작은 동물들이 함께 생활하고 일해요."
        />
        <DetailField
          label="세계관 규칙"
          multiline
          value="동물 캐릭터는 사람의 말을 이해하고 대화할 수 있어요. 사람은 화면에 턱 아래만 등장하며, 동물의 실제 체구 비율을 유지해요."
        />

        <div className={styles.cards}>
          <InfoCard title="연결 정보" items={CONNECTION_ITEMS} />
          <InfoCard title="관리 정보" items={MANAGEMENT_ITEMS} />
        </div>
      </div>
    </div>
  )
}

export default LibraryWorldDetailPage
