import { useLocation, useNavigate } from 'react-router-dom'
import { ConfirmPopup } from '../Popup'
import { CURRENT_CREDIT_BALANCE } from '../../../mocks/credit'

type InsufficientCreditPopupProps = {
  isOpen: boolean
  requiredCredit: number
  onCancel: () => void
}

function InsufficientCreditPopup({ isOpen, requiredCredit, onCancel }: InsufficientCreditPopupProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <ConfirmPopup
      isOpen={isOpen}
      title="크레딧이 부족해요"
      description={`이 작업에는 ${requiredCredit}크레딧이 필요해요.\n현재 보유 크레딧은 ${CURRENT_CREDIT_BALANCE.toLocaleString()}크레딧입니다.\n크레딧을 충전하고 계속할까요?`}
      confirmLabel="크레딧 충전"
      onCancel={onCancel}
      onConfirm={() => navigate('/mypage/credits/charge', { state: { returnTo: location.pathname } })}
    />
  )
}

export default InsufficientCreditPopup
