import { getAdminClient } from './lib'

async function main() {
  const client = getAdminClient()
  const { data, error } = await client
    .from('beta_testers')
    .select('email, name, role, status, joined_at, last_login_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('조회 실패:', error.message)
    process.exit(1)
  }

  console.table(data)
}

void main()
