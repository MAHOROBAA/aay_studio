import { useEffect, useRef, useState } from 'react'
import ChevronDownIcon from '../ChevronDownIcon/ChevronDownIcon'
import styles from './FilterDropdown.module.scss'

export type FilterDropdownOption = {
  label: string
  value: string
}

type FilterDropdownProps = {
  value: string
  options: FilterDropdownOption[]
  placeholder: string
  onChange: (value: string) => void
  triggerClassName?: string
  includeAllOption?: boolean
}

function FilterDropdown({
  value,
  options,
  placeholder,
  onChange,
  triggerClassName,
  includeAllOption = true,
}: FilterDropdownProps) {
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

  const currentLabel = options.find((option) => option.value === value)?.label ?? placeholder

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={[styles.trigger, triggerClassName].filter(Boolean).join(' ')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpen((prev) => !prev)}
      >
        {currentLabel}
        <ChevronDownIcon className={styles.triggerChevron} />
      </button>
      {isOpen && (
        <div className={styles.panel} role="listbox">
          {includeAllOption && (
            <button
              type="button"
              role="option"
              aria-selected={value === ''}
              className={styles.item}
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              {placeholder}
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={styles.item}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilterDropdown
