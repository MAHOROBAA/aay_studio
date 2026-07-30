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
  const rowGapClassName = editable ? styles.infoTableCompact : styles.infoTableWide

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
            {items.map((item) => (
              <p key={item.label}>{item.value}</p>
            ))}
          </div>
        </div>
      </div>
      {editable && (
        <button type="button" className={styles.editButton} onClick={onEdit}>
          수정
        </button>
      )}
    </div>
  )
}

export default InfoCard
