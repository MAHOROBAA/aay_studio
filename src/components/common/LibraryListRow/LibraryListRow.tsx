import CardMenu, { type CardMenuItem } from '../CardMenu/CardMenu'
import styles from './LibraryListRow.module.scss'

type LibraryListRowProps = {
  title: string
  badgeLabel: string
  description: string
  metadataItems: string[]
  onClick: () => void
  menuItems: CardMenuItem[]
}

function LibraryListRow({ title, badgeLabel, description, metadataItems, onClick, menuItems }: LibraryListRowProps) {
  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
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
        <CardMenu items={menuItems} triggerClassName={styles.more} ariaLabel={`${title} 더보기`} />
      </div>
    </div>
  )
}

export default LibraryListRow
