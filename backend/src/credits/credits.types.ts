export type CreditBalance = {
  availableBalance: number
  reservedBalance: number
}

export type CreditTransactionType =
  | 'BETA_INITIAL_GRANT'
  | 'BETA_MANUAL_GRANT'
  | 'BETA_MANUAL_DEDUCT'
  | 'RESERVE'
  | 'CONSUME'
  | 'REFUND'

export type CreditTransaction = {
  id: string
  user_id: string
  type: CreditTransactionType
  amount: number
  balance_after: number
  feature_type: string | null
  generation_job_id: string | null
  reason: string | null
  idempotency_key: string | null
  created_by: string | null
  created_at: string
}
