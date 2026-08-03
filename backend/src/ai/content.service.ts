import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

export type ContentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'

export type ContentRow = {
  id: string
  user_id: string
  status: ContentStatus
  result_object_key: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type SingleResult = { data: unknown; error: { message: string } | null }
type ListResult = { data: unknown; error: { message: string } | null }
type InsertFn = (payload: Record<string, unknown>) => {
  select: () => { single: () => Promise<SingleResult> }
}
type InsertManyFn = (payload: Record<string, unknown>[]) => Promise<ListResult>
type UpdateFn = (payload: Record<string, unknown>) => {
  eq: (
    column: string,
    value: string,
  ) => { select: () => { single: () => Promise<SingleResult> } }
}

@Injectable()
export class ContentService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createContent(userId: string): Promise<ContentRow> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('contents')
    const insert = query.insert.bind(query) as unknown as InsertFn
    const { data, error } = await insert({ user_id: userId, status: 'PENDING' })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data as ContentRow
  }

  async createScenes(
    contentId: string,
    scenes: { sceneOrder: number; videoObjectKey: string }[],
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('content_scenes')
    const insert = query.insert.bind(query) as unknown as InsertManyFn
    const { error } = await insert(
      scenes.map((scene) => ({
        content_id: contentId,
        scene_order: scene.sceneOrder,
        video_object_key: scene.videoObjectKey,
      })),
    )

    if (error) {
      throw new Error(error.message)
    }
  }

  async get(userId: string, contentId: string): Promise<ContentRow> {
    const client = this.supabaseService.getAdminClient()
    const { data, error } = await client
      .from('contents')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }
    if (!data) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.')
    }
    return data
  }

  async update(
    contentId: string,
    patch: Record<string, unknown>,
  ): Promise<ContentRow> {
    const client = this.supabaseService.getAdminClient()
    const query = client.from('contents')
    const update = query.update.bind(query) as unknown as UpdateFn
    const { data, error } = await update(patch)
      .eq('id', contentId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data as ContentRow
  }
}
