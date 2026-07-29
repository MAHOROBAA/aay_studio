import { useId, type SelectHTMLAttributes } from 'react'
import styles from './Dropdown.module.scss'

type DropdownOption = {
  label: string
  value: string
}

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: DropdownOption[]
  hideLabel?: boolean
}

function Dropdown({ label, options, id, className, hideLabel = false, ...rest }: DropdownProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={hideLabel ? styles.labelHidden : styles.label} htmlFor={selectId}>
        {label}
      </label>
      <div className={styles.control}>
        <select id={selectId} className={styles.select} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg className={styles.chevron} viewBox="0 0 13.3333 13.3333" fill="none" aria-hidden="true">
          <path
            d="M9.8313 5.08433L6.66666 8.24904L3.50195 5.08433"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

export default Dropdown
