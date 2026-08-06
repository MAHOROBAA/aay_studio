import { ConfigService } from '@nestjs/config'
import { CloudTasksService } from './cloud-tasks.service'

const createTaskMock = jest
  .fn<Promise<unknown[]>, [unknown]>()
  .mockResolvedValue([{}])
const queuePathMock = jest.fn(
  (projectId: string, location: string, queue: string) =>
    `projects/${projectId}/locations/${location}/queues/${queue}`,
)

jest.mock('@google-cloud/tasks', () => ({
  CloudTasksClient: jest.fn().mockImplementation(() => ({
    createTask: (arg: unknown): Promise<unknown[]> => createTaskMock(arg),
    queuePath: (projectId: string, location: string, queue: string): string =>
      queuePathMock(projectId, location, queue),
  })),
}))

describe('CloudTasksService', () => {
  const fakeConfig: Record<string, string> = {
    GOOGLE_CLOUD_PROJECT_ID: 'aay-project',
    GOOGLE_CLOUD_TASKS_LOCATION: 'asia-northeast3',
    CLOUD_TASKS_SCENE_VIDEO_QUEUE: 'aay-scene-video-generation',
    CLOUD_RUN_SERVICE_URL: 'https://aay-backend.example.run.app',
    CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL:
      'aay-studio-run-sa@aay-project.iam.gserviceaccount.com',
  }
  const configService = {
    getOrThrow: (key: string) => fakeConfig[key],
  } as unknown as ConfigService

  let service: CloudTasksService

  beforeEach(() => {
    createTaskMock.mockClear()
    service = new CloudTasksService(configService)
  })

  it('시작 task는 jobId 고정 이름을 쓴다(같은 job 중복 등록 방지)', async () => {
    await service.enqueueSceneVideoStart('job-123')

    const [{ parent, task }] = createTaskMock.mock.calls[0] as [
      { parent: string; task: Record<string, unknown> },
    ]
    expect(parent).toBe(
      'projects/aay-project/locations/asia-northeast3/queues/aay-scene-video-generation',
    )
    expect(task.name).toBe(
      'projects/aay-project/locations/asia-northeast3/queues/aay-scene-video-generation/tasks/scene-video-start-job-123',
    )
    expect(task.scheduleTime).toBeUndefined()
  })

  it('확인 task는 회차(pollAttempt)를 이름에 포함해 재사용 충돌을 피한다', async () => {
    await service.enqueueSceneVideoPoll('job-123', 1, 10)
    await service.enqueueSceneVideoPoll('job-123', 2, 10)

    const firstTask = (
      createTaskMock.mock.calls[0] as [{ task: Record<string, unknown> }]
    )[0].task
    const secondTask = (
      createTaskMock.mock.calls[1] as [{ task: Record<string, unknown> }]
    )[0].task

    expect(firstTask.name).toContain('scene-video-poll-job-123-1')
    expect(secondTask.name).toContain('scene-video-poll-job-123-2')
    expect(firstTask.name).not.toBe(secondTask.name)
  })

  it('확인 task는 지연 시간(scheduleTime)을 지정한다', async () => {
    const before = Math.floor(Date.now() / 1000)
    await service.enqueueSceneVideoPoll('job-123', 1, 10)
    const after = Math.floor(Date.now() / 1000)

    const task = (
      createTaskMock.mock.calls[0] as [{ task: Record<string, unknown> }]
    )[0].task
    const scheduleTime = task.scheduleTime as { seconds: number }
    expect(scheduleTime.seconds).toBeGreaterThanOrEqual(before + 10)
    expect(scheduleTime.seconds).toBeLessThanOrEqual(after + 10)
  })

  it('OIDC audience는 요청 URL 전체와 동일하게 설정한다', async () => {
    await service.enqueueSceneVideoStart('job-123')

    const task = (
      createTaskMock.mock.calls[0] as [{ task: Record<string, unknown> }]
    )[0].task
    const httpRequest = task.httpRequest as {
      url: string
      oidcToken: { audience: string }
    }
    expect(httpRequest.oidcToken.audience).toBe(httpRequest.url)
    expect(httpRequest.url).toBe(
      'https://aay-backend.example.run.app/internal/tasks/scene-video/start',
    )
  })
})
