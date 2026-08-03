import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'

export function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다. backend/.env를 확인하세요.')
  }
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

type CliOptionSpec = { required?: boolean }

export function parseCliArgs<T extends Record<string, CliOptionSpec>>(spec: T): Record<keyof T, string | undefined> {
  const { values } = parseArgs({
    options: Object.fromEntries(Object.keys(spec).map((key) => [key, { type: 'string' as const }])),
  })

  for (const [key, option] of Object.entries(spec)) {
    if (option.required && !values[key]) {
      console.error(`--${key} 값이 필요합니다.`)
      process.exit(1)
    }
  }

  return values as Record<keyof T, string | undefined>
}

export async function writeAuditLog(params: {
  action: string
  targetType: string
  targetId?: string
  beforeValue?: unknown
  afterValue?: unknown
  reason?: string
}): Promise<void> {
  const client = getAdminClient()
  const { error } = await client.from('admin_audit_logs').insert({
    admin_user_id: null,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    before_value: params.beforeValue ?? null,
    after_value: params.afterValue ?? null,
    reason: params.reason ?? null,
  })
  if (error) {
    console.error('감사 로그 기록 실패(작업 자체는 완료됨):', error.message)
  }
}

export async function getUserIdByEmail(email: string): Promise<string> {
  const client = getAdminClient()
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('email', normalizeEmail(email))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!data) {
    throw new Error('이 이메일로 로그인한 이력이 없습니다(아직 크레딧 계정이 없어요).')
  }
  return (data as { id: string }).id
}

type RpcResult = { data: unknown; error: { message: string } | null }
type RpcFn = (fnName: string, args: Record<string, unknown>) => Promise<RpcResult>

export async function callCreditRpc(fnName: string, args: Record<string, unknown>): Promise<unknown> {
  const client = getAdminClient()
  const rpc = client.rpc.bind(client) as unknown as RpcFn
  const { data, error } = await rpc(fnName, args)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export type BetaTesterStatus = 'invited' | 'active' | 'disabled'

export async function setBetaTesterStatus(email: string, status: 'active' | 'disabled', reason: string) {
  const client = getAdminClient()
  const normalizedEmail = normalizeEmail(email)

  const { data: before, error: fetchError } = await client
    .from('beta_testers')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }
  if (!before) {
    throw new Error('등록되지 않은 이메일입니다.')
  }

  const update: Record<string, unknown> = { status }
  if (status === 'disabled') {
    update.disabled_at = new Date().toISOString()
  }

  const { data: after, error: updateError } = await client
    .from('beta_testers')
    .update(update)
    .eq('email', normalizedEmail)
    .select()
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  await writeAuditLog({
    action: status === 'disabled' ? 'disable_tester' : 'enable_tester',
    targetType: 'beta_tester',
    targetId: String(after.id),
    beforeValue: before,
    afterValue: after,
    reason,
  })

  return after
}
