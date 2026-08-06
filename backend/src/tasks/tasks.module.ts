import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { StorageModule } from '../storage/storage.module'
import { CreditsModule } from '../credits/credits.module'
import { AiUsageLogModule } from '../ai-usage-log/ai-usage-log.module'
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module'
import { GeminiVideoModule } from '../gemini-video/gemini-video.module'
import { CloudTasksAuthGuard } from './cloud-tasks-auth.guard'
import { CloudTasksService } from './cloud-tasks.service'
import { SceneVideoWorkerController } from './scene-video-worker.controller'
import { SceneVideoWorkerService } from './scene-video-worker.service'

@Module({
  imports: [
    SupabaseModule,
    StorageModule,
    CreditsModule,
    AiUsageLogModule,
    GenerationJobsModule,
    GeminiVideoModule,
  ],
  controllers: [SceneVideoWorkerController],
  providers: [CloudTasksAuthGuard, CloudTasksService, SceneVideoWorkerService],
  exports: [CloudTasksService],
})
export class TasksModule {}
