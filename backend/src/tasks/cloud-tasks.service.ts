import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CloudTasksClient } from '@google-cloud/tasks'

export const SCENE_VIDEO_START_PATH = '/internal/tasks/scene-video/start'
export const SCENE_VIDEO_POLL_PATH = '/internal/tasks/scene-video/poll'

@Injectable()
export class CloudTasksService {
  private readonly client = new CloudTasksClient()

  constructor(private readonly configService: ConfigService) {}

  // 시작 task는 job마다 한 번만 존재해야 하므로 jobId 고정 이름을 쓴다 — Cloud Tasks가
  // 동일 이름 재생성을 거부하는 걸 그대로 중복 등록 방지에 활용한다.
  async enqueueSceneVideoStart(jobId: string): Promise<void> {
    await this.enqueue({
      taskName: `scene-video-start-${jobId}`,
      path: SCENE_VIDEO_START_PATH,
      payload: { jobId },
    })
  }

  // 확인 task는 완료될 때까지 여러 번 예약돼야 해서 시작 task와 이름 체계를 분리하고,
  // 매 회차(pollAttempt)를 이름에 포함해 재사용 충돌을 피한다.
  async enqueueSceneVideoPoll(
    jobId: string,
    pollAttempt: number,
    delaySeconds: number,
  ): Promise<void> {
    await this.enqueue({
      taskName: `scene-video-poll-${jobId}-${pollAttempt}`,
      path: SCENE_VIDEO_POLL_PATH,
      payload: { jobId, pollAttempt },
      delaySeconds,
    })
  }

  private async enqueue(params: {
    taskName: string
    path: string
    payload: unknown
    delaySeconds?: number
  }): Promise<void> {
    const projectId = this.configService.getOrThrow<string>(
      'GOOGLE_CLOUD_PROJECT_ID',
    )
    const location = this.configService.getOrThrow<string>(
      'GOOGLE_CLOUD_TASKS_LOCATION',
    )
    const queue = this.configService.getOrThrow<string>(
      'CLOUD_TASKS_SCENE_VIDEO_QUEUE',
    )
    const serviceUrl = this.configService.getOrThrow<string>(
      'CLOUD_RUN_SERVICE_URL',
    )
    const serviceAccountEmail = this.configService.getOrThrow<string>(
      'CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL',
    )

    const parent = this.client.queuePath(projectId, location, queue)
    const url = `${serviceUrl}${params.path}`

    const task: Record<string, unknown> = {
      name: `${parent}/tasks/${params.taskName}`,
      httpRequest: {
        httpMethod: 'POST',
        url,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify(params.payload)).toString('base64'),
        // audience는 CloudTasksAuthGuard가 검증하는 값과 정확히 같은 전체 URL을 사용한다.
        oidcToken: { serviceAccountEmail, audience: url },
      },
    }

    if (params.delaySeconds) {
      task.scheduleTime = {
        seconds: Math.floor(Date.now() / 1000) + params.delaySeconds,
      }
    }

    await this.client.createTask({ parent, task })
  }
}
