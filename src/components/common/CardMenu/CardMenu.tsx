import { useEffect, useRef, useState, type ReactNode } from 'react'
import MoreIcon from '../MoreIcon/MoreIcon'
import styles from './CardMenu.module.scss'

export type CardMenuItem = {
  key: string
  label: string
  icon: ReactNode
  danger?: boolean
  onSelect: () => void
}

type CardMenuProps = {
  items: CardMenuItem[]
  triggerClassName?: string
  ariaLabel?: string
}

function CardMenu({ items, triggerClassName, ariaLabel = '더보기' }: CardMenuProps) {
  const [isOpen, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={styles.wrapper} ref={wrapperRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={[styles.trigger, triggerClassName].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreIcon className={styles.triggerIcon} />
      </button>
      {isOpen && (
        <div className={styles.panel} role="menu">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={[styles.item, item.danger ? styles.itemDanger : ''].filter(Boolean).join(' ')}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              <span className={styles.itemIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CardMenu
