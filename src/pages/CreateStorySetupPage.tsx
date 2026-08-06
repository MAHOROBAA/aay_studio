import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import Dropdown from '../components/common/Dropdown/Dropdown'
import CharacterCreatePopup, { type NewCharacter } from '../components/common/CharacterCreatePopup/CharacterCreatePopup'
import PlatformChannelField from '../components/common/PlatformChannelField/PlatformChannelField'
import { AlertPopup } from '../components/common/Popup'
import styles from './CreateStorySetupPage.module.scss'

type CharacterCreateTarget = 'protagonist' | 'supporting'
type WorldMode = 'existing' | 'new' | 'none'
type StoryMode = 'new' | 'continue'

const STEPS = [
  { id: 'section-character', label: '캐릭터' },
  { id: 'section-world', label: '세계관' },
  { id: 'section-story', label: '스토리' },
  { id: 'section-settings', label: '설정' },
]

const EXISTING_WORLDS = [
  { id: 'w1', name: '햄찌네 회사생활' },
  { id: 'w2', name: '숲속 마을의 느긋한 하루' },
  { id: 'w3', name: '고양이 탐정 사무소' },
]

const PREVIOUS_STORIES = [
  { id: 's1', title: '김햄찌의 첫 출근' },
  { id: 's2', title: '사라진 점심 도시락' },
]

const WORLD_RECOMMENDATION =
  '작은 동물들이 사람들과 함께 일하는 평범한 회사예요. 체구 차이에서 생기는 소소한 사건과 직장 생활을 옴니버스 형식으로 다뤄요.'

const STORY_RECOMMENDATION = '처음 회사에 출근한 캐릭터가 거대한 사무용품 사이에서 자기 자리를 찾아가는 이야기예요.'

function CreateStorySetupPage() {
  const navigate = useNavigate()
  const [protagonist, setProtagonist] = useState<string | null>(null)
  const [supportingCast, setSupportingCast] = useState<string[]>([])
  const [createTarget, setCreateTarget] = useState<CharacterCreateTarget | null>(null)
  const [isCreatedAlertOpen, setCreatedAlertOpen] = useState(false)

  const [activeStepId, setActiveStepId] = useState(STEPS[0].id)

  const [worldMode, setWorldMode] = useState<WorldMode>('new')
  const [selectedWorldId, setSelectedWorldId] = useState('')
  const [worldDraft, setWorldDraft] = useState('')
  const [isWorldRecommending, setWorldRecommending] = useState(false)

  const [storyMode, setStoryMode] = useState<StoryMode>('new')
  const [selectedStoryId, setSelectedStoryId] = useState('')
  const [storyDraft, setStoryDraft] = useState('')
  const [isStoryRecommending, setStoryRecommending] = useState(false)

  function handleCreateCharacter(character: NewCharacter) {
    if (createTarget === 'supporting') {
      setSupportingCast((prev) => [...prev, character.name])
    } else {
      setProtagonist(character.name)
    }
    setCreateTarget(null)
    setCreatedAlertOpen(true)
  }

  const protagonistOptions = protagonist
    ? [{ label: protagonist, value: protagonist }]
    : [{ label: '캐릭터 선택', value: '' }]

  function handleSelectNewWorld() {
    setWorldMode('new')
    setStoryMode((prev) => (prev === 'continue' ? 'new' : prev))
  }

  function handleRecommendWorld() {
    setWorldRecommending(true)
    window.setTimeout(() => {
      setWorldDraft(WORLD_RECOMMENDATION)
      setWorldRecommending(false)
    }, 700)
  }

  function handleRecommendStory() {
    setStoryRecommending(true)
    window.setTimeout(() => {
      setStoryDraft(STORY_RECOMMENDATION)
      setStoryRecommending(false)
    }, 700)
  }

  const isContinueDisabled = worldMode === 'new'

  function handleStepClick(stepId: string) {
    setActiveStepId(stepId)
    document.getElementById(stepId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={styles.page}>
      <CharacterCreatePopup
        isOpen={createTarget !== null}
        onClose={() => setCreateTarget(null)}
        onCreate={handleCreateCharacter}
      />
      <AlertPopup
        isOpen={isCreatedAlertOpen}
        title="캐릭터를 만들었어요."
        description="새로 만든 캐릭터가 선택됐어요."
        onConfirm={() => setCreatedAlertOpen(false)}
      />

      <div className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.introTitle}>AI 동물 숏폼</p>
          <p className={styles.introSubtitle}>일관된 캐릭터와 세계관으로 짧은 이야기를 만들어요.</p>
        </div>

        <section id="section-character" className={styles.section}>
          <h2 className={styles.sectionTitle}>캐릭터</h2>
          <div className={styles.row}>
            <p className={styles.rowLabel}>주인공</p>
            <div className={styles.characterField}>
              <div className={styles.characterPreview}>
                <p>
                  캐릭터 이미지가
                  <br />
                  여기에 표시됩니다
                </p>
              </div>
              <Dropdown
                label="캐릭터 선택"
                hideLabel
                className={styles.characterSelect}
                options={protagonistOptions}
                value={protagonist ?? ''}
                onChange={() => {}}
              />
            </div>
            <button type="button" className={styles.chipButton} onClick={() => setCreateTarget('protagonist')}>
              새 캐릭터 만들기
            </button>
          </div>
          <div className={styles.row}>
            <p className={styles.rowLabel}>주변 인물</p>
            <button type="button" className={styles.chipButton} onClick={() => setCreateTarget('supporting')}>
              <svg className={styles.chipIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3.333V12.667M3.333 8H12.667" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              캐릭터 추가
            </button>
            {supportingCast.length > 0 && <p className={styles.supportingCastList}>{supportingCast.join(', ')}</p>}
          </div>
        </section>

        <section id="section-world" className={styles.section}>
          <h2 className={styles.sectionTitle}>세계관</h2>
          <div className={styles.optionsRow}>
            <Dropdown
              label="세계관 선택"
              hideLabel
              className={styles.worldSelect}
              options={[{ label: '세계관 선택', value: '' }, ...EXISTING_WORLDS.map((world) => ({ label: world.name, value: world.id }))]}
              value={worldMode === 'existing' ? selectedWorldId : ''}
              onChange={(event) => {
                setSelectedWorldId(event.target.value)
                setWorldMode('existing')
              }}
            />
            <button
              type="button"
              className={worldMode === 'new' ? styles.chipButton : styles.chipButtonMuted}
              onClick={handleSelectNewWorld}
            >
              새 세계관 만들기
            </button>
            <button
              type="button"
              className={worldMode === 'none' ? styles.chipButton : styles.chipButtonMuted}
              onClick={() => setWorldMode('none')}
            >
              사용하지 않기
            </button>
          </div>
          {worldMode === 'new' && (
            <div className={styles.textareaBox}>
              <textarea
                className={styles.textareaField}
                maxLength={1000}
                placeholder="새로운 세계관을 입력해 주세요."
                value={worldDraft}
                onChange={(event) => setWorldDraft(event.target.value)}
              />
              <div className={styles.textareaFooter}>
                <Button type="button" variant="secondary" disabled={isWorldRecommending} onClick={handleRecommendWorld}>
                  {isWorldRecommending ? '추천 중...' : 'N크레딧으로 AI 추천'}
                </Button>
                <p className={styles.textareaCounter}>{worldDraft.length} / 1,000</p>
              </div>
            </div>
          )}
        </section>

        <section id="section-story" className={styles.section}>
          <h2 className={styles.sectionTitle}>스토리</h2>
          <div className={styles.optionsRow}>
            <button
              type="button"
              className={storyMode === 'new' ? styles.chipButton : styles.chipButtonMuted}
              onClick={() => setStoryMode('new')}
            >
              새 이야기 만들기
            </button>
            <Dropdown
              label="이전 이야기 이어가기"
              hideLabel
              className={styles.worldSelect}
              disabled={isContinueDisabled}
              options={[
                { label: '이전 이야기 이어가기', value: '' },
                ...PREVIOUS_STORIES.map((story) => ({ label: story.title, value: story.id })),
              ]}
              value={storyMode === 'continue' ? selectedStoryId : ''}
              onChange={(event) => {
                setSelectedStoryId(event.target.value)
                setStoryMode('continue')
              }}
            />
          </div>
          {storyMode === 'new' && (
            <div className={styles.textareaBox}>
              <textarea
                className={styles.textareaField}
                maxLength={500}
                placeholder="새로운 이야기에 대한 간단한 아이디어를 적어 주세요."
                value={storyDraft}
                onChange={(event) => setStoryDraft(event.target.value)}
              />
              <div className={styles.textareaFooter}>
                <Button type="button" variant="secondary" disabled={isStoryRecommending} onClick={handleRecommendStory}>
                  {isStoryRecommending ? '추천 중...' : 'N크레딧으로 AI 추천'}
                </Button>
                <p className={styles.textareaCounter}>{storyDraft.length} / 500</p>
              </div>
            </div>
          )}
        </section>

        <section id="section-settings" className={styles.section}>
          <h2 className={styles.sectionTitle}>설정</h2>
          <div className={styles.row}>
            <p className={styles.rowLabel}>게시 플랫폼</p>
            <PlatformChannelField platformName="YouTube" />
          </div>
          <div className={styles.row}>
            <p className={styles.rowLabel}>영상 길이</p>
            <Dropdown
              label="영상 길이"
              hideLabel
              className={styles.worldSelect}
              options={[{ label: '20초', value: '20' }]}
            />
          </div>
        </section>

        <div className={styles.actions}>
          <Button type="button" variant="primary" onClick={() => navigate('/create/settings')}>
            AI 기획 만들기 →
          </Button>
        </div>
      </div>

      <aside className={styles.stepper}>
        {STEPS.map((step, index) => (
          <div key={step.id} className={styles.stepItem}>
            <button type="button" className={styles.stepButton} onClick={() => handleStepClick(step.id)}>
              <span className={[styles.stepBadge, step.id === activeStepId ? styles.stepBadgeActive : ''].join(' ')}>
                {index + 1}
              </span>
              <p className={styles.stepLabel}>{step.label}</p>
            </button>
            {index < STEPS.length - 1 && <div className={styles.stepConnector} />}
          </div>
        ))}
      </aside>
    </div>
  )
}

export default CreateStorySetupPage
