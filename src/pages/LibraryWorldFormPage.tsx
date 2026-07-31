import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import ChevronDownIcon from '../components/common/ChevronDownIcon/ChevronDownIcon'
import { AlertPopup } from '../components/common/Popup'
import styles from './LibraryWorldFormPage.module.scss'

const EXISTING_CHARACTERS = ['김햄찌', '진주씨', '팀장님', '모카', '콩이', '리오']

const WORLD_DETAIL_RECOMMENDATION =
  '작은 동물들이 사람들과 함께 일하는 평범한 회사예요. 체구 차이에서 생기는 소소한 사건과 직장 생활을 옴니버스 형식으로 다뤄요.'

const EDIT_INITIAL_VALUES = {
  name: '햄찌네 회사생활',
  shortDescription: '작은 동물들이 함께 일하는 회사 이야기',
  description:
    '작은 동물들이 사람들과 함께 일하는 평범한 회사예요. 체구 차이에서 생기는 소소한 사건과 직장 생활을 옴니버스 형식으로 다뤄요.',
  timeBackground: '현대의 평범한 사무실',
  spaceBackground: '도심 오피스',
  rules: '동물 캐릭터는 사람의 말을 이해하고 대화할 수 있어요. 사람은 화면에 턱 아래만 등장해요.',
  restrictions: '',
  connectedCharacter: '',
}

function LibraryWorldFormPage() {
  const navigate = useNavigate()
  const { worldId } = useParams()
  const isEditMode = Boolean(worldId)
  const initial = isEditMode
    ? EDIT_INITIAL_VALUES
    : { name: '', shortDescription: '', description: '', timeBackground: '', spaceBackground: '', rules: '', restrictions: '', connectedCharacter: '' }

  const [name, setName] = useState(initial.name)
  const [shortDescription, setShortDescription] = useState(initial.shortDescription)
  const [description, setDescription] = useState(initial.description)
  const [timeBackground, setTimeBackground] = useState(initial.timeBackground)
  const [spaceBackground, setSpaceBackground] = useState(initial.spaceBackground)
  const [rules, setRules] = useState(initial.rules)
  const [restrictions, setRestrictions] = useState(initial.restrictions)
  const [connectedCharacter, setConnectedCharacter] = useState(initial.connectedCharacter)
  const [isRecommending, setRecommending] = useState(false)
  const [isDoneAlertOpen, setDoneAlertOpen] = useState(false)

  function handleRecommend() {
    setRecommending(true)
    window.setTimeout(() => {
      setDescription(WORLD_DETAIL_RECOMMENDATION)
      setRecommending(false)
    }, 700)
  }

  function handleCancel() {
    navigate(isEditMode ? `/library/worlds/${worldId}` : '/library/worlds')
  }

  function handleSubmit() {
    if (!name.trim() || !description.trim()) {
      return
    }
    setDoneAlertOpen(true)
  }

  function handleAlertConfirm() {
    setDoneAlertOpen(false)
    navigate(isEditMode ? `/library/worlds/${worldId}` : '/library/worlds')
  }

  return (
    <div className={styles.page}>
      <AlertPopup
        isOpen={isDoneAlertOpen}
        title={isEditMode ? '세계관 수정을 완료했어요.' : '세계관을 만들었어요.'}
        description={isEditMode ? '변경한 내용이 저장됐어요.' : '만든 세계관은 스토리 영상 제작에서 바로 선택할 수 있어요.'}
        onConfirm={handleAlertConfirm}
      />

      <h1 className={styles.title}>{isEditMode ? '세계관 수정' : '세계관 만들기'}</h1>

      <div className={styles.form}>
        <div className={styles.row}>
          <p className={styles.label}>세계관 이름</p>
          <input
            type="text"
            className={styles.input}
            placeholder="세계관 이름을 입력해 주세요."
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>한 줄 설명</p>
          <input
            type="text"
            className={styles.input}
            placeholder="세계관을 간단히 설명해 주세요."
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>상세 설명</p>
          <textarea
            className={styles.textarea}
            placeholder="세계관의 배경과 분위기를 자세히 입력해 주세요."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>시간·공간 배경</p>
          <div className={styles.splitFields}>
            <input
              type="text"
              className={styles.input}
              placeholder="시간적 배경"
              value={timeBackground}
              onChange={(event) => setTimeBackground(event.target.value)}
            />
            <input
              type="text"
              className={styles.input}
              placeholder="공간적 배경"
              value={spaceBackground}
              onChange={(event) => setSpaceBackground(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>세계관 규칙</p>
          <textarea
            className={styles.textarea}
            placeholder="세계관에서 유지해야 할 규칙을 입력해 주세요."
            value={rules}
            onChange={(event) => setRules(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>금지 설정</p>
          <textarea
            className={styles.textareaSmall}
            placeholder="등장하면 안 되는 설정이나 표현을 입력해 주세요."
            value={restrictions}
            onChange={(event) => setRestrictions(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>연결 캐릭터</p>
          <div className={styles.selectField}>
            <select
              className={styles.select}
              value={connectedCharacter}
              onChange={(event) => setConnectedCharacter(event.target.value)}
            >
              <option value="">연결할 캐릭터를 선택해 주세요.</option>
              {EXISTING_CHARACTERS.map((character) => (
                <option key={character} value={character}>
                  {character}
                </option>
              ))}
            </select>
            <ChevronDownIcon className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>AI 추천</p>
          <div className={styles.aiBox}>
            <div className={styles.aiCopy}>
              <p className={styles.aiTitle}>AI 추천</p>
              <p className={styles.aiDescription}>입력한 내용을 바탕으로 부족한 설정을 제안해요.</p>
            </div>
            <Button type="button" variant="primary" disabled={isRecommending} onClick={handleRecommend}>
              {isRecommending ? '추천 중...' : 'N크레딧으로 AI 추천'}
            </Button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            취소
          </Button>
          <Button type="button" variant="primary" disabled={!name.trim() || !description.trim()} onClick={handleSubmit}>
            {isEditMode ? '수정 완료' : '세계관 만들기'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LibraryWorldFormPage
