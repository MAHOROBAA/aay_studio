import styles from './DetailField.module.scss'

type DetailFieldProps = {
  label: string
  value: string
  multiline?: boolean
}

function DetailField({ label, value, multiline = false }: DetailFieldProps) {
  return (
    <div className={[styles.row, multiline ? styles.rowStart : ''].join(' ')}>
      <p className={[styles.label, multiline ? styles.labelStart : ''].join(' ')}>{label}</p>
      <div className={[styles.box, multiline ? styles.boxTall : styles.boxShort].join(' ')}>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  )
}

export default DetailField
