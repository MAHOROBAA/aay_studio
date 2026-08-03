import { getAdminClient, normalizeEmail, parseCliArgs, writeAuditLog } from './lib'

async function main() {
  const args = parseCliArgs({
    email: { required: true },
    name: {},
    role: {},
  })

  const email = normalizeEmail(args.email!)
  const role = args.role === 'admin' ? 'admin' : 'tester'

  const client = getAdminClient()
  const { data, error } = await client
    .from('beta_testers')
    .insert({ email, name: args.name ?? null, role, status: 'invited', invited_by: 'cli' })
    .select()
    .single()

  if (error) {
    console.error('등록 실패:', error.message)
    process.exit(1)
  }

  await writeAuditLog({
    action: 'add_tester',
    targetType: 'beta_tester',
    targetId: String(data.id),
    afterValue: data,
    reason: 'cli tester:add',
  })

  console.log('테스터 등록 완료:')
  console.log(data)
}

void main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
