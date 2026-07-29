import styles from './PagePlaceholder.module.scss'

type PagePlaceholderProps = {
  title: string
}

function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <div className={styles.placeholder}>
      <h1 className={styles.title}>{title}</h1>
    </div>
  )
}

export default PagePlaceholder
