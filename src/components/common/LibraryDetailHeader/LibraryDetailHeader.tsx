import type { ReactNode } from 'react'
import Button from '../Button/Button'
import styles from './LibraryDetailHeader.module.scss'

type LibraryDetailHeaderProps = {
  backLabel: string
  onBack: () => void
  title: string
  badge?: ReactNode
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

function LibraryDetailHeader({
  backLabel,
  onBack,
  title,
  badge,
  showActions = true,
  onEdit,
  onDelete,
}: LibraryDetailHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Button type="button" variant="secondary" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
      <div className={styles.center}>
        <h1 className={styles.title}>{title}</h1>
        {badge}
      </div>
      <div className={styles.actions}>
        {showActions && (
          <>
            <Button type="button" variant="secondary" onClick={onEdit}>
              수정
            </Button>
            <Button type="button" variant="danger" onClick={onDelete}>
              삭제
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default LibraryDetailHeader
