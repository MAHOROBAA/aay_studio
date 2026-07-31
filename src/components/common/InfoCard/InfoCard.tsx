import { useState } from 'react'
import styles from './InfoCard.module.scss'

type InfoCardItem = {
  label: string
  value: string
}

type InfoCardProps = {
  title: string
  items: InfoCardItem[]
  editable?: boolean
  onEdit?: () => void
}

function InfoCard({ title, items, editable = false, onEdit }: InfoCardProps) {
  const [isEditing, setEditing] = useState(false)
  const [values, setValues] = useState(() => items.map((item) => item.value))

  const rowGapClassName = editable ? styles.infoTableCompact : styles.infoTableWide

  function handleEditButtonClick() {
    setEditing((prev) => !prev)
    onEdit?.()
  }

  function handleValueChange(index: number, value: string) {
    setValues((prev) => prev.map((current, i) => (i === index ? value : current)))
  }

  return (
    <div className={styles.infoCard}>
      <div className={styles.infoBody}>
        <p className={styles.infoTitle}>{title}</p>
        <div className={[styles.infoTable, rowGapClassName].join(' ')}>
          <div className={styles.infoLabels}>
            {items.map((item) => (
              <p key={item.label}>{item.label}</p>
            ))}
          </div>
          <div className={styles.infoValues}>
            {items.map((item, index) =>
              isEditing ? (
                <div key={item.label} className={styles.infoValueRow}>
                  <input
                    className={styles.infoValueInput}
                    value={values[index]}
                    onChange={(event) => handleValueChange(index, event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.infoValueClear}
                    aria-label={`${item.label} 입력 지우기`}
                    onClick={() => handleValueChange(index, '')}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.36 12.24-1.12 1.12L12 13.12l-2.24 2.24-1.12-1.12L10.88 12 8.64 9.76l1.12-1.12L12 10.88l2.24-2.24 1.12 1.12L13.12 12l2.24 2.24z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p key={item.label}>{values[index]}</p>
              ),
            )}
          </div>
        </div>
      </div>
      {editable && (
        <button type="button" className={styles.editButton} onClick={handleEditButtonClick}>
          {isEditing ? '저장' : '수정'}
        </button>
      )}
    </div>
  )
}

export default InfoCard
