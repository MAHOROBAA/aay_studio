import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerFilled'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

function Button({ variant = 'primary', disabled, className, type = 'button', ...rest }: ButtonProps) {
  const variantClassName = disabled ? styles.disabled : styles[variant]

  return (
    <button
      type={type}
      disabled={disabled}
      className={[styles.button, variantClassName, className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}

export default Button
