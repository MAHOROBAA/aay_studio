import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import ChevronDownIcon from '../components/common/ChevronDownIcon/ChevronDownIcon'
import styles from './MyPageCreditHistoryPage.module.scss'

type ChargeHistoryRow = {
  id: string
  date: string
  type: string
  amount: string
  payment: string
  status: string
  balance: string
}

const CHARGE_HISTORY: ChargeHistoryRow[] = [
  { id: 'h1', date: '2026.07.30 09:12', type: '가입 크레딧', amount: '+500', payment: '-', status: '지급 완료', balance: '1,500' },
  {
    id: 'h2',
    date: '2026.07.27 18:42',
    type: '유료 충전',
    amount: '+3,000 · 보너스 +150',
    payment: '30,000원',
    status: '결제 완료',
    balance: '1,000',
  },
  { id: 'h3', date: '2026.07.27 18:15', type: '첫 게시 보상', amount: '+100', payment: '-', status: '지급 완료', balance: '850' },
  { id: 'h4', date: '2026.07.20 10:05', type: '주간 제작 지원', amount: '+30', payment: '-', status: '지급 완료', balance: '750' },
  { id: 'h5', date: '2026.07.13 10:02', type: '주간 제작 지원', amount: '+30', payment: '-', status: '지급 완료', balance: '720' },
]

function MyPageCreditHistoryPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>크레딧 내역</p>
      <p className={styles.pageDescription}>충전된 크레딧과 콘텐츠 제작에 사용한 내역을 확인할 수 있어요.</p>

      <div className={styles.summary}>
        <div className={styles.summaryBalance}>
          <p className={styles.balanceLabel}>사용 가능한 크레딧</p>
          <div className={styles.balanceRow}>
            <span className={styles.balanceNumber}>1,500</span>
            <span className={styles.balanceUnit}>크레딧</span>
          </div>
        </div>
        <p className={styles.balanceBreakdown}>무료 500 · 보너스 150 · 유료 850</p>
        <Button type="button" variant="primary" onClick={() => navigate('/mypage/credits/charge')}>
          크레딧 충전
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button type="button" className={[styles.tab, styles.tabActive].join(' ')}>
            충전 내역
          </button>
          <button type="button" className={styles.tab}>
            사용 내역
          </button>
        </div>
        <button type="button" className={styles.periodFilter}>
          <span className={styles.periodLabel}>조회 기간</span>
          <span className={styles.periodValue}>최근 3개월</span>
          <ChevronDownIcon className={styles.periodChevron} />
        </button>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span className={styles.colDate}>일시</span>
          <span className={styles.colType}>구분</span>
          <span className={styles.colAmount}>충전 크레딧</span>
          <span className={styles.colPayment}>결제 금액</span>
          <span className={styles.colStatus}>상태</span>
          <span className={styles.colBalance}>잔액</span>
        </div>
        {CHARGE_HISTORY.map((row) => (
          <div key={row.id} className={styles.tableRow}>
            <span className={styles.colDate}>{row.date}</span>
            <span className={styles.colType}>{row.type}</span>
            <span className={[styles.colAmount, styles.amountValue].join(' ')}>{row.amount}</span>
            <span className={styles.colPayment}>{row.payment}</span>
            <span className={styles.colStatus}>{row.status}</span>
            <span className={[styles.colBalance, styles.balanceValue].join(' ')}>{row.balance}</span>
          </div>
        ))}
        <p className={styles.expiryNote}>
          무료·보너스 크레딧은 지급 유형에 따라 유효기간이 다르며, 만료 예정 크레딧부터 우선 사용됩니다.
        </p>
      </div>
    </div>
  )
}

export default MyPageCreditHistoryPage
