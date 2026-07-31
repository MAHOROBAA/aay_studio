import { useRef, useState, type ChangeEvent } from 'react'
import Button from '../Button/Button'
import styles from './CharacterCreatePopup.module.scss'

type CreateMode = 'description' | 'image'
type ImageState = 'idle' | 'loading' | 'ready'

export type NewCharacter = {
  name: string
  summary: string
  imageInfo: string
}

type CharacterCreatePopupProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (character: NewCharacter) => void
}

function CharacterCreatePopup({ isOpen, onClose, onCreate }: CharacterCreatePopupProps) {
  const [mode, setMode] = useState<CreateMode>('description')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [traits, setTraits] = useState('')
  const [repImageState, setRepImageState] = useState<ImageState>('idle')
  const [refImages, setRefImages] = useState<string[]>([])
  const uploadInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) {
    return null
  }

  function resetForm() {
    setMode('description')
    setName('')
    setDescription('')
    setTraits('')
    setRepImageState('idle')
    setRefImages([])
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleGenerateRepImage() {
    setRepImageState('loading')
    window.setTimeout(() => setRepImageState('ready'), 600)
  }

  function handleUploadRepImage(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) {
      return
    }
    setRepImageState('ready')
    if (mode === 'image' && !description) {
      setDescription('사진을 분석해서 작성한 캐릭터 설명이 여기에 채워져요. 필요하면 직접 수정해 주세요.')
    }
    event.target.value = ''
  }

  function handleAddRefImage() {
    if (refImages.length >= 3) {
      return
    }
    setRefImages((prev) => [...prev, `참고 이미지 ${prev.length + 1}`])
  }

  function handleSubmit() {
    if (!name.trim() || !description.trim()) {
      return
    }
    onCreate({
      name: name.trim(),
      summary: description.trim(),
      imageInfo: refImages.length > 0 ? `참고 이미지 ${refImages.length}장` : '대표 이미지 1장',
    })
    resetForm()
  }

  return (
    <div className={styles.dim}>
      <div className={styles.card} role="dialog" aria-modal="true">
        <p className={styles.brand}>Aaaay!</p>
        <h2 className={styles.title}>아래 방식을 선택해 새로운 캐릭터를 추가하세요</h2>

        <div className={styles.body}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={[styles.tab, mode === 'description' ? styles.tabActive : ''].join(' ')}
              onClick={() => setMode('description')}
            >
              설명으로 만들기
            </button>
            <button
              type="button"
              className={[styles.tab, mode === 'image' ? styles.tabActive : ''].join(' ')}
              onClick={() => setMode('image')}
            >
              이미지로 만들기
            </button>
          </div>

          <div className={styles.field}>
            <p className={styles.label}>이름</p>
            <input
              type="text"
              className={styles.input}
              placeholder="캐릭터 이름을 입력해주세요"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {mode === 'image' && (
            <div className={styles.field}>
              <p className={styles.label}>대표 이미지</p>
              <div className={styles.imageBox}>
                {repImageState === 'ready' ? (
                  <p className={styles.imageReadyLabel}>업로드 완료</p>
                ) : (
                  <>
                    <p className={styles.imageHint}>사진을 업로드하면 AI가 분석해 캐릭터 설명을 작성해요.</p>
                    <Button type="button" variant="secondary" onClick={() => uploadInputRef.current?.click()}>
                      업로드
                    </Button>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={handleUploadRepImage}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <p className={styles.label}>캐릭터 설명</p>
            <textarea
              className={styles.textarea}
              placeholder={'캐릭터의 외형에 대한 설명을 입력해주세요\n예: 통통한 골든 햄스터, 둥근 얼굴과 작은 귀를 가지고 있으며 항상 흰색 셔츠를 입고 있다.'}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <p className={styles.label}>특징 또는 소품</p>
            <input
              type="text"
              className={styles.input}
              placeholder="예: 빨간 넥타이, 둥근 안경, 왼쪽 귀의 점"
              value={traits}
              onChange={(event) => setTraits(event.target.value)}
            />
          </div>

          {mode === 'description' && (
            <div className={styles.field}>
              <p className={styles.label}>대표 이미지</p>
              <div className={styles.imageBox}>
                {repImageState === 'ready' ? (
                  <p className={styles.imageReadyLabel}>이미지 생성 완료</p>
                ) : (
                  <>
                    <p className={styles.imageHint}>입력한 설명을 바탕으로 이미지를 생성해 보세요</p>
                    <Button type="button" variant="primary" disabled={!description.trim()} onClick={handleGenerateRepImage}>
                      {repImageState === 'loading' ? '생성 중...' : 'N크레딧으로 이미지 생성'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <p className={styles.label}>참고 이미지 (최대 3장)</p>
            <div className={styles.imageBox}>
              <p className={styles.imageHint}>다양한 각도와 표정의 이미지를 추가하면 캐릭터를 더 일관되게 표현할 수 있어요.</p>
              {refImages.length > 0 && (
                <div className={styles.refImageList}>
                  {refImages.map((label) => (
                    <span key={label} className={styles.refImageChip}>
                      {label}
                    </span>
                  ))}
                </div>
              )}
              {refImages.length < 3 && (
                <div className={styles.refImageActions}>
                  <Button type="button" variant="secondary" onClick={handleAddRefImage}>
                    업로드
                  </Button>
                  <Button type="button" variant="primary" onClick={handleAddRefImage}>
                    N크레딧으로 이미지 생성
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" className={styles.cancelButton} onClick={handleClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            className={styles.confirmButton}
            disabled={!name.trim() || !description.trim()}
            onClick={handleSubmit}
          >
            만들기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CharacterCreatePopup
