import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button/Button'
import ChevronRightIcon from '../components/common/ChevronRightIcon/ChevronRightIcon'
import { RiskConfirmPopup } from '../components/common/Popup'
import styles from './MyPage.module.scss'

function MyPage() {
  const navigate = useNavigate()
  const [isWithdrawalOpen, setWithdrawalOpen] = useState(false)

  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>마이페이지</p>
      <p className={styles.pageDescription}>계정과 크레딧, 연결된 플랫폼을 관리할 수 있어요.</p>

      <RiskConfirmPopup
        isOpen={isWithdrawalOpen}
        title="계정을 탈퇴할까요?"
        description="탈퇴하면 남은 크레딧과 연결 계정 정보가 삭제되며 복구할 수 없어요."
        confirmLabel="탈퇴"
        onCancel={() => setWithdrawalOpen(false)}
        onConfirm={() => navigate('/')}
      />

      <div className={styles.creditCard}>
        <div className={styles.creditHeader}>
          <p className={styles.sectionTitle}>크레딧</p>
          <Button type="button" variant="primary" onClick={() => navigate('/mypage/credits/charge')}>
            크레딧 충전
          </Button>
        </div>
        <div className={styles.creditBody}>
          <div className={styles.creditBalance}>
            <p className={styles.balanceLabel}>사용 가능한 크레딧</p>
            <div className={styles.balanceRow}>
              <span className={styles.balanceNumber}>1,500</span>
              <span className={styles.balanceUnit}>크레딧</span>
            </div>
          </div>
          <div className={styles.creditInfo}>
            <p className={styles.creditDescription}>
              캐릭터·이미지·스토리·영상 등 AI 콘텐츠 제작에 사용되며, 사용 전에 차감 예정 크레딧을 확인할 수 있어요.
            </p>
            <div className={styles.creditLinks}>
              <button type="button" onClick={() => navigate('/mypage/credits')}>
                충전 내역
              </button>
              <span>·</span>
              <button type="button" onClick={() => navigate('/mypage/credits')}>
                사용 내역
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.sectionTitle}>연결 계정</p>
          <p className={styles.sectionDescription}>게시할 플랫폼을 연결하고 관리해 주세요.</p>
          <div className={styles.divider} />
          <div className={styles.accountRow}>
            <div className={styles.accountInfo}>
              <span className={styles.accountPlatform}>YouTube</span>
              <span className={styles.accountValue}>io******o@gmail.com</span>
              <span className={styles.connectedBadge}>연결됨</span>
            </div>
            <Button type="button" variant="secondary">
              변경
            </Button>
          </div>
          <div className={styles.accountRow}>
            <div className={styles.accountInfo}>
              <span className={styles.accountPlatform}>TikTok</span>
              <span className={styles.accountValue}>연결된 계정이 없어요.</span>
            </div>
            <Button type="button" variant="secondary">
              연결
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.sectionTitle}>계정 정보</p>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>가입 이메일</span>
            <span className={styles.infoValue}>i*******o@gmail.com</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>로그인 방식</span>
            <span className={styles.infoValue}>Google 계정</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.logoutRow}>
            <p className={styles.securityNote}>공용 기기에서는 사용 후 로그아웃해 주세요.</p>
            <Button type="button" variant="secondary">
              로그아웃
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.sectionTitle}>서비스 정보</p>
          <button type="button" className={styles.serviceRow}>
            <span>이용약관</span>
            <ChevronRightIcon className={styles.serviceChevron} />
          </button>
          <div className={styles.divider} />
          <button type="button" className={styles.serviceRow}>
            <span>개인정보처리방침</span>
            <ChevronRightIcon className={styles.serviceChevron} />
          </button>
          <div className={styles.divider} />
          <button type="button" className={styles.serviceRow}>
            <span>크레딧 이용·환불 정책</span>
            <ChevronRightIcon className={styles.serviceChevron} />
          </button>
        </div>

        <div className={styles.card}>
          <p className={styles.sectionTitle}>계정 관리</p>
          <p className={styles.withdrawalTitle}>계정 탈퇴</p>
          <p className={styles.withdrawalDescription}>탈퇴하면 남은 크레딧과 연결 계정 정보가 삭제되며 복구할 수 없어요.</p>
          <div className={styles.withdrawalAction}>
            <Button type="button" variant="danger" onClick={() => setWithdrawalOpen(true)}>
              계정 탈퇴
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPage
