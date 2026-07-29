import { useEffect, useId, type ReactNode } from 'react'
import styles from './Popup.module.scss'

type PopupShellProps = {
  title: string
  description: string
  children: ReactNode
}

function PopupShell({ title, description, children }: PopupShellProps) {
  const titleId = useId()

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div className={styles.dim}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <p className={styles.brand}>Aaaay!</p>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>{children}</div>
      </div>
    </div>
  )
}

export default PopupShell
