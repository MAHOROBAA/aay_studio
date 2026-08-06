import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { GenerationJobService } from './generation-job.service'

@Module({
  imports: [SupabaseModule],
  providers: [GenerationJobService],
  exports: [GenerationJobService],
})
export class GenerationJobsModule {}
