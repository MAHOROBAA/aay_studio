import { NavLink } from 'react-router-dom'
import styles from './LibraryTabs.module.scss'

const TABS = [
  { label: '영상', to: '/library/videos' },
  { label: '캐릭터', to: '/library/characters' },
  { label: '세계관', to: '/library/worlds' },
  { label: '스토리', to: '/library/stories' },
]

function LibraryTabs() {
  return (
    <div className={styles.tabs}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}

export default LibraryTabs
