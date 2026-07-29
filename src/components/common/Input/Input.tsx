import { useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.scss'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

function Input({ label, id, className, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input id={inputId} className={styles.input} {...rest} />
    </div>
  )
}

export default Input
