import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import type { AiUsageLogEntry } from './ai.types'

type InsertResult = { error: { message: string } | null }
type InsertFn = (payload: Record<string, unknown>) => Promise<InsertResult>

@Injectable()
export class AiUsageLogService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async record(entry: AiUsageLogEntry): Promise<void> {
    const { error } = await this.insertRow('ai_usage_logs', {
      user_id: entry.userId,
      generation_job_id: entry.generationJobId,
      feature_type: entry.featureType,
      provider: entry.provider,
      model: entry.model,
      input_tokens: entry.inputTokens ?? null,
      output_tokens: entry.outputTokens ?? null,
      provider_cost_usd: entry.providerCostUsd ?? null,
      exchange_rate: entry.exchangeRate ?? null,
      provider_cost_krw: entry.providerCostKrw ?? null,
      credit_reserved: entry.creditReserved,
      credit_consumed: entry.creditConsumed,
      status: entry.status,
      error_message: entry.errorMessage ?? null,
      requested_at: entry.requestedAt,
      completed_at: entry.completedAt,
      duration_ms: entry.durationMs,
    })

    if (error) {
      // 사용량 기록 실패가 생성 자체를 막지는 않되, 원가 추적 공백이 생기므로 반드시 눈에 띄게 남긴다.
      console.error('ai_usage_logs 기록 실패:', error.message)
    }
  }

  async getTotalCostUsdSince(sinceIso: string): Promise<number> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = await client
      .from('ai_usage_logs')
      .select('provider_cost_usd')
      .eq('status', 'SUCCEEDED')
      .gte('requested_at', sinceIso)

    if (error) {
      throw new Error(error.message)
    }

    const rows = data as { provider_cost_usd: number | null }[]
    return rows.reduce((sum, row) => sum + (row.provider_cost_usd ?? 0), 0)
  }

  // Supabase 클라이언트를 Database 제네릭 없이 만들어서(SupabaseService 참고) insert()의 인자 타입이
  // never로 좁혀진다 — CreditsService.callRpc와 동일하게 이 헬퍼로만 캐스팅을 좁혀 둔다.
  private insertRow(
    table: string,
    payload: Record<string, unknown>,
  ): Promise<InsertResult> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from(table)
    const insert = query.insert.bind(query) as unknown as InsertFn
    return insert(payload)
  }
}
