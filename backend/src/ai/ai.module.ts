import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { CreditsModule } from '../credits/credits.module'
import { StorageModule } from '../storage/storage.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { AiUsageLogService } from './ai-usage-log.service'
import { GeneratedAssetService } from './generated-asset.service'
import { GenerationJobService } from './generation-job.service'
import { GeminiImageProvider } from './gemini-image.provider'
import { GeminiTextProvider } from './gemini-text.provider'
import { GeminiVideoProvider } from './gemini-video.provider'

@Module({
  imports: [SupabaseModule, AuthModule, CreditsModule, StorageModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiUsageLogService,
    GeneratedAssetService,
    GenerationJobService,
    GeminiTextProvider,
    GeminiImageProvider,
    GeminiVideoProvider,
  ],
  exports: [AiService],
})
export class AiModule {}
