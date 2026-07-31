import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import InfoCard from '../components/common/InfoCard/InfoCard'
import InsufficientCreditPopup from '../components/common/InsufficientCreditPopup/InsufficientCreditPopup'
import { CURRENT_CREDIT_BALANCE } from '../mocks/credit'
import styles from './CreateSettingsPage.module.scss'

const REQUIRED_CREDIT = 24

const DIRECTION_ITEMS = [
  { label: '분위기', value: '차분하고 아늑하게' },
  { label: '화면', value: '비 오는 밤의 창문' },
  { label: '스타일', value: '영화처럼 사실적으로' },
  { label: '색상', value: '짙은 파랑, 따뜻한 호박색' },
  { label: '움직임', value: '느리고 섬세하게' },
]

const SCENE_ITEMS = [
  { label: '0~5초', value: '창문에 맺힌 빗방울' },
  { label: '5~15초', value: '따뜻한 카페 내부' },
  { label: '15~20초', value: '흐릿한 도시의 불빛' },
]

const AUDIO_ITEMS = [
  { label: '음악', value: '잔잔한 피아노' },
  { label: '템포', value: '느리게' },
  { label: '효과음', value: '잔잔한 빗소리' },
  { label: '음성', value: '없음' },
]

const OUTPUT_ITEMS = [
  { label: '게시 플랫폼', value: 'YouTube' },
  { label: '화면 비율', value: '16:9 가로형' },
  { label: '영상 길이', value: '20초' },
  { label: '해상도', value: '1080p' },
  { label: '오디오', value: '음악 + 효과음' },
]

const GENERATION_ITEMS = [
  { label: '예상 비용', value: '24크레딧' },
  { label: '예상 시간', value: '2~4분' },
  { label: '현재 잔액', value: '1,500크레딧' },
  { label: '생성 후 잔액', value: '1,476크레딧' },
]

function CreateSettingsPage() {
  const navigate = useNavigate()
  const [isInsufficientOpen, setInsufficientOpen] = useState(false)

  function handleGenerate() {
    if (CURRENT_CREDIT_BALANCE < REQUIRED_CREDIT) {
      setInsufficientOpen(true)
      return
    }
    navigate('/create/generating', { state: { flow: 'story' } })
  }

  return (
    <div className={styles.page}>
      <InsufficientCreditPopup
        isOpen={isInsufficientOpen}
        requiredCredit={REQUIRED_CREDIT}
        onCancel={() => setInsufficientOpen(false)}
      />
      <div className={styles.content}>
        <h1 className={styles.heading}>AI 기획을 확인해보세요</h1>

        <div className={styles.summary}>
          <p className={styles.summaryTitle}>요약</p>
          <div className={styles.summaryTable}>
            <div className={styles.summaryLabels}>
              <p>템플릿</p>
              <p>주인공</p>
              <p>주변 인물</p>
              <p>세계관</p>
              <p>스토리</p>
            </div>
            <div className={styles.summaryValues}>
              <p>AI 동물 숏폼</p>
              <div className={styles.summaryPerson}>
                <div className={styles.summaryAvatar} />
                <p>김햄찌</p>
              </div>
              <div className={styles.summaryPeople}>
                <div className={styles.summaryPerson}>
                  <div className={styles.summaryAvatar} />
                  <p>진주씨</p>
                </div>
                <div className={styles.summaryPerson}>
                  <div className={styles.summaryAvatar} />
                  <p>팀장님</p>
                </div>
              </div>
              <p>디자인 에이전시에 근무하는 김햄찌와 진주씨</p>
              <p>김햄찌가 파일명을 수정하지 않고 거래처로 메일을 보내 펼쳐지는 이야기</p>
            </div>
          </div>
        </div>

        <div className={styles.columns}>
          <div className={styles.mainColumn}>
            <InfoCard title="연출 방향" items={DIRECTION_ITEMS} editable />
            <InfoCard title="장면 구성" items={SCENE_ITEMS} editable />
            <InfoCard title="오디오 구성" items={AUDIO_ITEMS} editable />
          </div>

          <div className={styles.sideColumn}>
            <InfoCard title="출력 정보" items={OUTPUT_ITEMS} />
            <InfoCard title="생성 정보" items={GENERATION_ITEMS} />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => navigate('/create/story/setup')}>
            ← 설정 수정
          </Button>
          <Button type="button" variant="primary" onClick={handleGenerate}>
            생성 · 24크레딧 →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateSettingsPage
