import styles from './Stepper.module.scss'

const STEPS = ['요청', 'AI 기획', '생성', '검토', '게시']

type StepperProps = {
  current: number
}

function Stepper({ current }: StepperProps) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((label, index) => {
        const step = index + 1
        const isLast = step === STEPS.length

        return (
          <div key={label} className={[styles.stepGroup, isLast ? styles.stepGroupLast : ''].join(' ')}>
            <div className={styles.stepItem}>
              <span className={[styles.badge, step === current ? styles.badgeActive : ''].join(' ')}>{step}</span>
              <p className={styles.label}>{label}</p>
            </div>
            {!isLast && <div className={styles.connector} />}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
