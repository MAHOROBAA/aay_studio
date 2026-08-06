import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

export type GenerationJobStatus =
  'PENDING' | 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'

export type GenerationJobRow = {
  id: string
  user_id: string
  feature_type: string
  status: GenerationJobStatus
  provider: string
  model: string
  provider_operation_id: string | null
  input: Record<string, unknown>
  requested_duration_seconds: number | null
  actual_duration_seconds: number | null
  resolution: string | null
  result_object_key: string | null
  poll_attempt: number
  error_code: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type SingleResult = { data: unknown; error: { message: string } | null }
type InsertFn = (payload: Record<string, unknown>) => {
  select: () => { single: () => Promise<SingleResult> }
}
type UpdateFn = (payload: Record<string, unknown>) => {
  eq: (
    column: string,
    value: string,
  ) => { select: () => { single: () => Promise<SingleResult> } }
}

@Injectable()
export class GenerationJobService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(params: {
    userId: string
    featureType: string
    provider: string
    model: string
    input: Record<string, unknown>
  }): Promise<GenerationJobRow> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('generation_jobs')
    const insert = query.insert.bind(query) as unknown as InsertFn
    const { data, error } = await insert({
      user_id: params.userId,
      feature_type: params.featureType,
      status: 'PENDING',
      provider: params.provider,
      model: params.model,
      input: params.input,
    })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data as GenerationJobRow
  }

  // 사용자 소유 확인이 필요한 프론트엔드 조회 경로용.
  async get(userId: string, jobId: string): Promise<GenerationJobRow> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = await client
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }
    if (!data) {
      throw new NotFoundException('생성 작업을 찾을 수 없습니다.')
    }
    return data
  }

  // Cloud Tasks Worker용 — 사용자 컨텍스트가 없으므로 소유자 필터 없이 조회한다.
  async getById(jobId: string): Promise<GenerationJobRow | null> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = await client
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }
    return data ?? null
  }

  async update(
    jobId: string,
    patch: Record<string, unknown>,
  ): Promise<GenerationJobRow> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('generation_jobs')
    const update = query.update.bind(query) as unknown as UpdateFn
    const { data, error } = await update(patch)
      .eq('id', jobId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data as GenerationJobRow
  }
}
