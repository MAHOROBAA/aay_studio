import MoreIcon from '../MoreIcon/MoreIcon'
import styles from './LibraryListRow.module.scss'

type LibraryListRowProps = {
  title: string
  badgeLabel: string
  description: string
  metadataItems: string[]
  onClick: () => void
}

function LibraryListRow({ title, badgeLabel, description, metadataItems, onClick }: LibraryListRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <div className={styles.summary}>
        <div className={styles.titleRow}>
          <p className={styles.title}>{title}</p>
          <span className={styles.badge}>{badgeLabel}</span>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.metadata}>
        {metadataItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
        <MoreIcon className={styles.more} />
      </div>
    </button>
  )
}

export default LibraryListRow
