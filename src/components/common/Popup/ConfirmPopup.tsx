import Button from '../Button/Button'
import PopupShell from './PopupShell'
import styles from './Popup.module.scss'

type ConfirmPopupProps = {
  isOpen: boolean
  title: string
  description: string
  cancelLabel?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmPopup({
  isOpen,
  title,
  description,
  cancelLabel = '취소',
  confirmLabel = '확인',
  onCancel,
  onConfirm,
}: ConfirmPopupProps) {
  if (!isOpen) {
    return null
  }

  return (
    <PopupShell title={title} description={description}>
      <Button type="button" variant="secondary" className={styles.cancelButton} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="button" variant="primary" className={styles.confirmButton} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </PopupShell>
  )
}

export default ConfirmPopup
