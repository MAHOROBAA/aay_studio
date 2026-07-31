import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import ChevronDownIcon from '../components/common/ChevronDownIcon/ChevronDownIcon'
import { AlertPopup } from '../components/common/Popup'
import styles from './LibraryStoryFormPage.module.scss'

const EXISTING_WORLDS = ['햄찌네 회사생활', '숲속 마을의 느긋한 하루', '고양이 탐정 사무소']
const EXISTING_CHARACTERS = ['김햄찌', '진주씨', '팀장님', '모카', '콩이', '리오']
const STORY_TYPES = ['옴니버스', '이어쓰기']
const PREVIOUS_STORIES = ['김햄찌의 첫 출근', '사라진 점심 도시락']

const STORY_SUMMARY_RECOMMENDATION = '처음 회사에 출근한 캐릭터가 거대한 사무용품 사이에서 자기 자리를 찾아가는 이야기예요.'

const EDIT_INITIAL_VALUES = {
  title: '김햄찌의 첫 출근',
  world: '햄찌네 회사생활',
  character: '김햄찌',
  storyType: '옴니버스',
  summary: '처음 회사에 출근한 김햄찌가 거대한 사무용품 사이에서 자기 자리를 찾아가는 이야기예요.',
  content:
    '첫 출근 날, 김햄찌는 사람용 책상 위에 놓인 거대한 키보드와 의자를 마주해요. 진주씨의 도움으로 작은 상자를 책상 삼아 자기만의 업무 공간을 완성해요.',
  previousStory: '',
}

function LibraryStoryFormPage() {
  const navigate = useNavigate()
  const { storyId } = useParams()
  const isEditMode = Boolean(storyId)
  const initial = isEditMode
    ? EDIT_INITIAL_VALUES
    : { title: '', world: '', character: '', storyType: '', summary: '', content: '', previousStory: '' }

  const [title, setTitle] = useState(initial.title)
  const [world, setWorld] = useState(initial.world)
  const [character, setCharacter] = useState(initial.character)
  const [storyType, setStoryType] = useState(initial.storyType)
  const [summary, setSummary] = useState(initial.summary)
  const [content, setContent] = useState(initial.content)
  const [previousStory, setPreviousStory] = useState(initial.previousStory)
  const [isRecommending, setRecommending] = useState(false)
  const [isDoneAlertOpen, setDoneAlertOpen] = useState(false)

  function handleRecommend() {
    setRecommending(true)
    window.setTimeout(() => {
      setSummary(STORY_SUMMARY_RECOMMENDATION)
      setRecommending(false)
    }, 700)
  }

  function handleCancel() {
    navigate(isEditMode ? `/library/stories/${storyId}` : '/library/stories')
  }

  function handleSubmit() {
    if (!title.trim() || !summary.trim()) {
      return
    }
    setDoneAlertOpen(true)
  }

  function handleAlertConfirm() {
    setDoneAlertOpen(false)
    navigate(isEditMode ? `/library/stories/${storyId}` : '/library/stories')
  }

  return (
    <div className={styles.page}>
      <AlertPopup
        isOpen={isDoneAlertOpen}
        title={isEditMode ? '스토리 수정을 완료했어요.' : '스토리를 만들었어요.'}
        description={isEditMode ? '변경한 내용이 저장됐어요.' : '만든 스토리는 스토리 영상 제작에서 바로 이어갈 수 있어요.'}
        onConfirm={handleAlertConfirm}
      />

      <h1 className={styles.title}>{isEditMode ? '스토리 수정' : '스토리 만들기'}</h1>

      <div className={styles.form}>
        <div className={styles.row}>
          <p className={styles.label}>스토리 제목</p>
          <input
            type="text"
            className={styles.input}
            placeholder="스토리 제목을 입력해 주세요."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>세계관</p>
          <div className={styles.selectField}>
            <select className={styles.select} value={world} onChange={(event) => setWorld(event.target.value)}>
              <option value="">세계관을 선택해 주세요.</option>
              {EXISTING_WORLDS.map((worldName) => (
                <option key={worldName} value={worldName}>
                  {worldName}
                </option>
              ))}
            </select>
            <ChevronDownIcon className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>등장 캐릭터</p>
          <div className={styles.selectField}>
            <select className={styles.select} value={character} onChange={(event) => setCharacter(event.target.value)}>
              <option value="">등장할 캐릭터를 선택해 주세요.</option>
              {EXISTING_CHARACTERS.map((characterName) => (
                <option key={characterName} value={characterName}>
                  {characterName}
                </option>
              ))}
            </select>
            <ChevronDownIcon className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>이야기 형식</p>
          <div className={styles.selectField}>
            <select className={styles.select} value={storyType} onChange={(event) => setStoryType(event.target.value)}>
              <option value="">옴니버스 · 이어쓰기 등 형식을 선택해 주세요.</option>
              {STORY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDownIcon className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>줄거리</p>
          <textarea
            className={styles.textarea}
            placeholder="이야기의 핵심 줄거리를 입력해 주세요."
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>상세 이야기</p>
          <textarea
            className={styles.textareaLarge}
            placeholder="장면과 사건의 흐름을 자세히 입력해 주세요."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>

        <div className={styles.row}>
          <p className={styles.label}>이전 이야기</p>
          <div className={styles.selectField}>
            <select
              className={styles.select}
              value={previousStory}
              onChange={(event) => setPreviousStory(event.target.value)}
            >
              <option value="">이어갈 이전 이야기를 선택해 주세요.</option>
              {PREVIOUS_STORIES.map((story) => (
                <option key={story} value={story}>
                  {story}
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
              <p className={styles.aiDescription}>세계관과 캐릭터를 바탕으로 이야기 초안을 제안해요.</p>
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
          <Button type="button" variant="primary" disabled={!title.trim() || !summary.trim()} onClick={handleSubmit}>
            {isEditMode ? '수정 완료' : '스토리 만들기'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LibraryStoryFormPage
