import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AiUsageLogService } from './ai-usage-log.service'

@Module({
  imports: [SupabaseModule],
  providers: [AiUsageLogService],
  exports: [AiUsageLogService],
})
export class AiUsageLogModule {}
