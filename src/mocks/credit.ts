export const CURRENT_CREDIT_BALANCE = 1500

export type PaymentResult = 'success' | 'failure'

// PG 솔루션을 붙이면 이 값 대신 실제 PG 응답으로 결과를 결정한다.
export const MOCK_PAYMENT_RESULT: PaymentResult = 'success'

export function requestCreditPayment(): Promise<PaymentResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(MOCK_PAYMENT_RESULT), 700)
  })
}
