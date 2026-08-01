import Button from '../Button/Button'
import PopupShell from './PopupShell'
import styles from './Popup.module.scss'

type AlertPopupProps = {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
}

function AlertPopup({ isOpen, title, description, confirmLabel = '확인', onConfirm }: AlertPopupProps) {
  if (!isOpen) {
    return null
  }

  return (
    <PopupShell title={title} description={description}>
      <Button type="button" variant="primary" className={styles.confirmButton} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </PopupShell>
  )
}

export default AlertPopup
