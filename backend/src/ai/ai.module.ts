import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { CreditsModule } from '../credits/credits.module'
import { StorageModule } from '../storage/storage.module'
import { AiUsageLogModule } from '../ai-usage-log/ai-usage-log.module'
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module'
import { TasksModule } from '../tasks/tasks.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ContentService } from './content.service'
import { FfmpegConcatService } from './ffmpeg-concat.service'
import { GeneratedAssetService } from './generated-asset.service'
import { GeminiImageProvider } from './gemini-image.provider'
import { GeminiTextProvider } from './gemini-text.provider'

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    CreditsModule,
    StorageModule,
    AiUsageLogModule,
    GenerationJobsModule,
    TasksModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    GeneratedAssetService,
    ContentService,
    FfmpegConcatService,
    GeminiTextProvider,
    GeminiImageProvider,
  ],
  exports: [AiService],
})
export class AiModule {}
