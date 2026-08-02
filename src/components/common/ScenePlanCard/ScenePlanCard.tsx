import { useState } from 'react'
import infoCardStyles from '../InfoCard/InfoCard.module.scss'
import styles from './ScenePlanCard.module.scss'

export type Scene = {
  id: string
  durationSec: number
  description: string
}

type ScenePlanCardProps = {
  title: string
  totalDurationLimit: number
  initialScenes: Scene[]
}

let sceneIdSeq = 0

function createSceneId() {
  sceneIdSeq += 1
  return `new-scene-${sceneIdSeq}`
}

function ScenePlanCard({ title, totalDurationLimit, initialScenes }: ScenePlanCardProps) {
  const [isEditing, setEditing] = useState(false)
  const [scenes, setScenes] = useState(initialScenes)

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationSec, 0)
  const isOverLimit = totalDuration > totalDurationLimit

  function handleEditButtonClick() {
    if (isEditing && isOverLimit) {
      return
    }
    setEditing((prev) => !prev)
  }

  function handleAddScene() {
    setScenes((prev) => [...prev, { id: createSceneId(), durationSec: 0, description: '' }])
  }

  function handleRemoveScene(id: string) {
    setScenes((prev) => prev.filter((scene) => scene.id !== id))
  }

  function handleDurationChange(id: string, value: string) {
    const durationSec = Number(value.replace(/[^0-9]/g, '')) || 0
    setScenes((prev) => prev.map((scene) => (scene.id === id ? { ...scene, durationSec } : scene)))
  }

  function handleDescriptionChange(id: string, description: string) {
    setScenes((prev) => prev.map((scene) => (scene.id === id ? { ...scene, description } : scene)))
  }

  const viewRows = scenes.map((scene, index) => {
    const start = scenes.slice(0, index).reduce((sum, precedingScene) => sum + precedingScene.durationSec, 0)
    const end = start + scene.durationSec
    return { id: scene.id, rangeLabel: `${start}~${end}초`, description: scene.description }
  })

  return (
    <div className={infoCardStyles.infoCard}>
      <div className={infoCardStyles.infoBody}>
        <p className={infoCardStyles.infoTitle}>{title}</p>
        {isEditing ? (
          <div className={styles.editArea}>
            <div className={styles.sceneRows}>
              {scenes.map((scene, index) => (
                <div key={scene.id} className={styles.sceneRow}>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={`장면 ${index + 1} 삭제`}
                    onClick={() => handleRemoveScene(scene.id)}
                  >
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5.5 8H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className={styles.sceneLabel}>scene {index + 1}</span>
                  <span className={styles.durationField}>
                    <input
                      className={styles.durationInput}
                      value={scene.durationSec}
                      onChange={(event) => handleDurationChange(scene.id, event.target.value)}
                      inputMode="numeric"
                      aria-label={`장면 ${index + 1} 길이(초)`}
                    />
                    <span className={styles.durationUnit}>sec</span>
                  </span>
                  <div className={styles.descriptionField}>
                    <input
                      className={styles.descriptionInput}
                      value={scene.description}
                      onChange={(event) => handleDescriptionChange(scene.id, event.target.value)}
                      aria-label={`장면 ${index + 1} 내용`}
                    />
                    <button
                      type="button"
                      className={styles.descriptionClear}
                      aria-label={`장면 ${index + 1} 내용 지우기`}
                      onClick={() => handleDescriptionChange(scene.id, '')}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.36 12.24-1.12 1.12L12 13.12l-2.24 2.24-1.12-1.12L10.88 12 8.64 9.76l1.12-1.12L12 10.88l2.24-2.24 1.12 1.12L13.12 12l2.24 2.24z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className={styles.addSceneButton} onClick={handleAddScene}>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5.5 8H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M8 5.5V10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              장면 추가
            </button>
            <p className={styles.totalDuration}>
              전체 길이 <span className={isOverLimit ? styles.totalDurationOver : undefined}>{totalDuration}</span>/
              {totalDurationLimit}초
            </p>
          </div>
        ) : (
          <div className={[infoCardStyles.infoTable, infoCardStyles.infoTableCompact].join(' ')}>
            <div className={infoCardStyles.infoLabels}>
              {viewRows.map((row) => (
                <p key={row.id}>{row.rangeLabel}</p>
              ))}
            </div>
            <div className={infoCardStyles.infoValues}>
              {viewRows.map((row) => (
                <p key={row.id}>{row.description}</p>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        className={[infoCardStyles.editButton, isEditing ? infoCardStyles.editButtonActive : ''].join(' ')}
        disabled={isEditing && isOverLimit}
        onClick={handleEditButtonClick}
      >
        {isEditing ? '저장' : '수정'}
      </button>
    </div>
  )
}

export default ScenePlanCard
