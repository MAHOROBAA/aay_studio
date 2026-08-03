import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

type InsertResult = { error: { message: string } | null }
type InsertFn = (payload: Record<string, unknown>) => Promise<InsertResult>

@Injectable()
export class GeneratedAssetService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async register(params: {
    userId: string
    generationJobId: string
    assetType: 'CHARACTER_IMAGE' | 'SCENE_IMAGE'
    objectKey: string
    mimeType: string
  }): Promise<void> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('generated_assets')
    const insert = query.insert.bind(query) as unknown as InsertFn
    const { error } = await insert({
      user_id: params.userId,
      generation_job_id: params.generationJobId,
      asset_type: params.assetType,
      object_key: params.objectKey,
      mime_type: params.mimeType,
    })

    if (error) {
      // 자산 등록 실패가 생성 자체를 막지는 않되, R2에는 파일이 이미 있으므로 반드시 눈에 띄게 남긴다.
      console.error('generated_assets 기록 실패:', error.message)
    }
  }
}
