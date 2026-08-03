import { getAdminClient, normalizeEmail, parseCliArgs } from './lib'

async function main() {
  const args = parseCliArgs({ email: { required: true } })
  const client = getAdminClient()
  const { data, error } = await client
    .from('beta_testers')
    .select('*')
    .eq('email', normalizeEmail(args.email!))
    .maybeSingle()

  if (error) {
    console.error('조회 실패:', error.message)
    process.exit(1)
  }
  if (!data) {
    console.log('등록되지 않은 이메일입니다.')
    return
  }
  console.log(data)
}

void main()
