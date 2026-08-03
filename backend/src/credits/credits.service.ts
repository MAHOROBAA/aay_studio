import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import type { CreditBalance, CreditTransaction } from './credits.types'

type RpcResult = { data: unknown; error: { message: string } | null }
type RpcFn = (
  fnName: string,
  args: Record<string, unknown>,
) => Promise<RpcResult>

@Injectable()
export class CreditsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getBalance(userId: string): Promise<CreditBalance> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = await client
      .from('credit_accounts')
      .select('available_balance, reserved_balance')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new BadRequestException(error.message)
    }
    if (!data) {
      throw new NotFoundException('크레딧 계정을 찾을 수 없습니다.')
    }

    const row = data as { available_balance: number; reserved_balance: number }
    return {
      availableBalance: row.available_balance,
      reservedBalance: row.reserved_balance,
    }
  }

  async reserve(params: {
    userId: string
    amount: number
    featureType: string
    idempotencyKey: string
  }): Promise<CreditTransaction> {
    const { data, error } = await this.callRpc('reserve_credit', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_feature_type: params.featureType,
      p_idempotency_key: params.idempotencyKey,
    })
    return handleCreditRpcResult(data, error)
  }

  async consume(params: {
    userId: string
    amount: number
    generationJobId?: string
    idempotencyKey: string
  }): Promise<CreditTransaction> {
    const { data, error } = await this.callRpc('consume_credit', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_generation_job_id: params.generationJobId ?? null,
      p_idempotency_key: params.idempotencyKey,
    })
    return handleCreditRpcResult(data, error)
  }

  async refund(params: {
    userId: string
    amount: number
    reason: string
    idempotencyKey: string
  }): Promise<CreditTransaction> {
    const { data, error } = await this.callRpc('refund_credit', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_reason: params.reason,
      p_idempotency_key: params.idempotencyKey,
    })
    return handleCreditRpcResult(data, error)
  }

  // Supabase 클라이언트를 Database 제네릭 없이 만들어서(SupabaseService 참고) rpc()의 인자 타입이
  // 정확히 추론되지 않는다 — 커스텀 Postgres 함수 호출 지점만 이 헬퍼로 좁혀서 캐스팅한다.
  private callRpc(
    fnName: string,
    args: Record<string, unknown>,
  ): Promise<RpcResult> {
    const client = this.supabaseService.getAdminClient()
    const rpc = client.rpc.bind(client) as unknown as RpcFn
    return rpc(fnName, args)
  }
}

function handleCreditRpcResult(
  data: unknown,
  error: { message: string } | null,
): CreditTransaction {
  if (error) {
    if (
      error.message.includes('insufficient_credit') ||
      error.message.includes('insufficient_reserved_credit')
    ) {
      throw new BadRequestException('크레딧이 부족해요.')
    }
    if (error.message.includes('account_not_found')) {
      throw new NotFoundException('크레딧 계정을 찾을 수 없습니다.')
    }
    if (error.message.includes('invalid_amount')) {
      throw new BadRequestException('올바르지 않은 크레딧 수량이에요.')
    }
    throw new BadRequestException(error.message)
  }
  return data as CreditTransaction
}
