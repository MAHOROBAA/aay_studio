import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common'
import { CloudTasksAuthGuard } from './cloud-tasks-auth.guard'
import { SceneVideoWorkerService } from './scene-video-worker.service'

type StartTaskBody = { jobId: string }
type PollTaskBody = { jobId: string; pollAttempt: number }

@Controller('internal/tasks/scene-video')
@UseGuards(CloudTasksAuthGuard)
export class SceneVideoWorkerController {
  constructor(private readonly workerService: SceneVideoWorkerService) {}

  @Post('start')
  handleStart(
    @Body() body: StartTaskBody,
    @Headers('x-cloudtasks-taskretrycount') retryCountHeader?: string,
  ): Promise<void> {
    const retryCount = Number(retryCountHeader ?? '0')
    return this.workerService.handleStart(body.jobId, retryCount)
  }

  @Post('poll')
  handlePoll(@Body() body: PollTaskBody): Promise<void> {
    return this.workerService.handlePoll(body.jobId, body.pollAttempt)
  }
}
