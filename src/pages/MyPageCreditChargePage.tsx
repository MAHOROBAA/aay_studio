import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import styles from './MyPageCreditChargePage.module.scss'

type CreditProduct = {
  id: string
  label: string
  subLabel: string
  price: string
  originalPrice?: string
  bonusPercent?: string
}

const PRODUCTS: CreditProduct[] = [
  { id: 'p1', label: '500 크레딧', subLabel: '500', price: '5,000원' },
  { id: 'p2', label: '1,000 크레딧', subLabel: '1,000', price: '10,000원' },
  {
    id: 'p3',
    label: '3,150 크레딧',
    subLabel: '3,000 + 150 보너스',
    price: '30,000원',
    originalPrice: '31,500원',
    bonusPercent: '+5%',
  },
  {
    id: 'p4',
    label: '5,500 크레딧',
    subLabel: '5,000 + 500 보너스',
    price: '50,000원',
    originalPrice: '55,000원',
    bonusPercent: '+10%',
  },
  {
    id: 'p5',
    label: '11,500 크레딧',
    subLabel: '10,000 + 1,500 보너스',
    price: '100,000원',
    originalPrice: '115,000원',
    bonusPercent: '+15%',
  },
]

function MyPageCreditChargePage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('p3')

  const selected = PRODUCTS.find((product) => product.id === selectedId) ?? PRODUCTS[2]

  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>크레딧 충전</p>
      <p className={styles.pageDescription}>충전 상품을 선택하고 AI 콘텐츠 제작에 사용할 크레딧을 충전해 주세요.</p>

      <div className={styles.summary}>
        <div className={styles.summaryBalance}>
          <p className={styles.balanceLabel}>보유 크레딧</p>
          <div className={styles.balanceRow}>
            <span className={styles.balanceNumber}>1,500</span>
            <span className={styles.balanceUnit}>크레딧</span>
          </div>
        </div>
        <p className={styles.balanceBreakdown}>무료 500 · 보너스 0 · 유료 1,000</p>
        <Button type="button" variant="primary" onClick={() => navigate('/mypage/credits')}>
          상세 내역
        </Button>
      </div>

      <div className={styles.tabs}>
        <button type="button" className={[styles.tab, styles.tabActive].join(' ')}>
          크레딧 충전
        </button>
        <button type="button" className={styles.tab}>
          주간 제작 지원
        </button>
      </div>

      <div className={styles.purchaseArea}>
        <div className={styles.productList}>
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              type="button"
              className={[styles.product, product.id === selectedId ? styles.productSelected : ''].join(' ')}
              onClick={() => setSelectedId(product.id)}
            >
              <div className={styles.productAmount}>
                <p className={styles.productLabel}>{product.label}</p>
                <p className={styles.productSubLabel}>{product.subLabel}</p>
              </div>
              <div className={styles.productPriceInfo}>
                {product.bonusPercent && <span className={styles.bonusBadge}>{product.bonusPercent}</span>}
                <div className={styles.priceBlock}>
                  {product.originalPrice && <span className={styles.originalPrice}>{product.originalPrice}</span>}
                  <span className={styles.price}>{product.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.selectedArea}>
          <div className={styles.selectedSummary}>
            <p className={styles.selectedLabel}>{selected.label}</p>
            <p className={styles.selectedSubLabel}>{selected.subLabel}</p>
            <p className={styles.selectedPayment}>결제 금액 {selected.price}</p>
          </div>
          <div className={styles.payButtonWrap}>
            <Button type="button" variant="primary">
              결제하기
            </Button>
          </div>
          <div className={styles.notice}>
            <p className={styles.noticeTitle}>결제 시 참고해 주세요.</p>
            <ul className={styles.noticeList}>
              <li>· 미사용 유료 크레딧은 결제 후 7일 이내 청약철회가 가능해요.</li>
              <li>· 보너스 크레딧을 포함해 일부 사용한 경우 환불이 제한될 수 있어요.</li>
              <li>· 유료 크레딧의 사용 기한은 결제일로부터 1년이에요.</li>
              <li>· AI 결과의 단순 품질 차이는 환불 사유에 포함되지 않아요.</li>
              <li>· 자세한 내용은 크레딧 이용·환불 정책에서 확인해 주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPageCreditChargePage
