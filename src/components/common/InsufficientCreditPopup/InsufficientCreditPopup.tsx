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
      title="크레딧이 부족합니다."
      description={`영상을 생성하려면 ${requiredCredit}크레딧이 필요합니다.\n현재 보유 크레딧: ${CURRENT_CREDIT_BALANCE.toLocaleString()}`}
      confirmLabel="크레딧 충전"
      onCancel={onCancel}
      onConfirm={() => navigate('/mypage/credits/charge', { state: { returnTo: location.pathname } })}
    />
  )
}

export default InsufficientCreditPopup
