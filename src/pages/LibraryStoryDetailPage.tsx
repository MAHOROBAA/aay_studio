import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LibraryDetailHeader from '../components/common/LibraryDetailHeader/LibraryDetailHeader'
import DetailField from '../components/common/DetailField/DetailField'
import InfoCard from '../components/common/InfoCard/InfoCard'
import { RiskConfirmPopup } from '../components/common/Popup'
import styles from './LibraryStoryDetailPage.module.scss'

const CONNECTION_ITEMS = [
  { label: '연결 세계관', value: '햄찌네 회사생활' },
  { label: '등장 캐릭터', value: '3명' },
  { label: '이전 이야기', value: '없음' },
  { label: '다음 이야기', value: '2개' },
  { label: '사용 영상', value: '1개' },
]

const MANAGEMENT_ITEMS = [
  { label: '작성 방식', value: 'AI 추천' },
  { label: '생성일', value: '2026.07.20' },
  { label: '수정일', value: '2026.07.27' },
  { label: '사용 크레딧', value: '4 크레딧' },
]

function LibraryStoryDetailPage() {
  const navigate = useNavigate()
  const { storyId } = useParams()
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className={styles.page}>
      <LibraryDetailHeader
        backLabel="← 스토리 목록"
        onBack={() => navigate('/library/stories')}
        title="스토리 상세"
        onEdit={() => navigate(`/library/stories/${storyId}/edit`)}
        onDelete={() => setDeleteOpen(true)}
      />

      <RiskConfirmPopup
        isOpen={isDeleteOpen}
        title="스토리를 삭제할까요?"
        description="삭제하면 다시 복구할 수 없어요. 이미 만든 영상은 그대로 유지돼요."
        confirmLabel="삭제"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => navigate('/library/stories')}
      />

      <div className={styles.content}>
        <DetailField label="스토리 제목" value="김햄찌의 첫 출근" />
        <DetailField
          label="스토리 요약"
          multiline
          value="처음 회사에 출근한 김햄찌가 거대한 사무용품 사이에서 자기 자리를 찾아가는 이야기예요."
        />
        <DetailField label="스토리 유형" value="단편" />
        <DetailField
          label="스토리 내용"
          multiline
          value="첫 출근 날, 김햄찌는 사람용 책상 위에 놓인 거대한 키보드와 의자를 마주해요. 진주씨의 도움으로 작은 상자를 책상 삼아 자기만의 업무 공간을 완성해요."
        />

        <div className={styles.cards}>
          <InfoCard title="연결 정보" items={CONNECTION_ITEMS} />
          <InfoCard title="관리 정보" items={MANAGEMENT_ITEMS} />
        </div>
      </div>
    </div>
  )
}

export default LibraryStoryDetailPage
