import { NavLink, useLocation } from 'react-router-dom'
import { CURRENT_CREDIT_BALANCE } from '../../../mocks/credit'
import styles from './Sidebar.module.scss'

const MENU_ITEMS = [
  { label: '홈', to: '/home', end: true },
  { label: '만들기', to: '/create', end: false },
  { label: '라이브러리', to: '/library', end: false },
  { label: '마이페이지', to: '/mypage', end: false },
]

function Sidebar() {
  const { pathname } = useLocation()
  const showCredit = pathname !== '/home'

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].filter(Boolean).join(' ')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      {showCredit && (
        <div className={styles.credit}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M7.5 11.6667C7.5 13.0475 9.73833 14.1667 12.5 14.1667C15.2617 14.1667 17.5 13.0475 17.5 11.6667C17.5 10.2858 15.2617 9.16667 12.5 9.16667C9.73833 9.16667 7.5 10.2858 7.5 11.6667Z"
              stroke="white"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.5 11.6667V15C7.5 16.38 9.73833 17.5 12.5 17.5C15.2617 17.5 17.5 16.38 17.5 15V11.6667"
              stroke="white"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 7.165C3.45333 6.71833 2.5 5.89333 2.5 5C2.5 4.10667 3.45333 3.28167 5 2.835C6.54667 2.38833 8.45333 2.38833 10 2.835C11.5467 3.28167 12.5 4.10667 12.5 5C12.5 5.89333 11.5467 6.71833 10 7.165C8.45333 7.61167 6.54667 7.61167 5 7.165Z"
              stroke="white"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 5V13.3333C2.5 14.0733 3.14333 14.5417 4.16667 15"
              stroke="white"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 9.16667C2.5 9.90667 3.14333 10.375 4.16667 10.8333"
              stroke="white"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{CURRENT_CREDIT_BALANCE.toLocaleString()}크레딧</span>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
