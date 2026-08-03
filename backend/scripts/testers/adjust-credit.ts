import { randomUUID } from 'node:crypto'
import { callCreditRpc, getUserIdByEmail, parseCliArgs } from './lib'

async function main() {
  const args = parseCliArgs({
    email: { required: true },
    amount: { required: true },
    reason: { required: true },
  })

  const amount = Number(args.amount)
  if (!Number.isInteger(amount) || amount === 0) {
    console.error('--amount는 0이 아닌 정수여야 합니다(양수: 지급, 음수: 회수).')
    process.exit(1)
  }

  const userId = await getUserIdByEmail(args.email!)
  const idempotencyKey = `cli-manual-${randomUUID()}`

  const result =
    amount > 0
      ? await callCreditRpc('grant_manual_credit', {
          p_user_id: userId,
          p_amount: amount,
          p_reason: args.reason,
          p_idempotency_key: idempotencyKey,
          p_created_by: 'cli',
        })
      : await callCreditRpc('deduct_manual_credit', {
          p_user_id: userId,
          p_amount: Math.abs(amount),
          p_reason: args.reason,
          p_idempotency_key: idempotencyKey,
          p_created_by: 'cli',
        })

  console.log(amount > 0 ? '크레딧 지급 완료:' : '크레딧 회수 완료:')
  console.log(result)
}

void main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
