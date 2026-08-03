import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { CreditsModule } from '../credits/credits.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { AiUsageLogService } from './ai-usage-log.service'
import { GeminiTextProvider } from './gemini-text.provider'

@Module({
  imports: [SupabaseModule, AuthModule, CreditsModule],
  controllers: [AiController],
  providers: [AiService, AiUsageLogService, GeminiTextProvider],
  exports: [AiService],
})
export class AiModule {}
