import { ConfigService } from '@nestjs/config'
import { SceneVideoWorkerService } from './scene-video-worker.service'
import type { GenerationJobRow } from '../generation-jobs/generation-job.service'

const fakeConfig: Record<string, string> = {
  CLOUD_TASKS_SCENE_VIDEO_MAX_ATTEMPTS: '3',
  USD_KRW_EXCHANGE_RATE: '1440',
  AI_VIDEO_DURATION_SECONDS: '4',
}
const configService = {
  getOrThrow: (key: string) => fakeConfig[key],
} as unknown as ConfigService

function buildJob(overrides: Partial<GenerationJobRow> = {}): GenerationJobRow {
  return {
    id: 'job-1',
    user_id: 'user-1',
    feature_type: 'SCENE_VIDEO',
    status: 'QUEUED',
    provider: 'google',
    model: 'veo-3.1-lite-generate-preview',
    provider_operation_id: null,
    input: { prompt: '테스트 프롬프트', referenceImageKey: null },
    requested_duration_seconds: 4,
    actual_duration_seconds: null,
    resolution: '720p',
    result_object_key: null,
    poll_attempt: 0,
    error_code: null,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    ...overrides,
  }
}

describe('SceneVideoWorkerService', () => {
  let creditsService: { consume: jest.Mock; refund: jest.Mock }
  let storageService: { uploadObject: jest.Mock; getObjectBytes: jest.Mock }
  let usageLogService: { record: jest.Mock }
  let generationJobService: { getById: jest.Mock; update: jest.Mock }
  let videoProvider: { startSceneVideo: jest.Mock; checkOperation: jest.Mock }
  let cloudTasksService: { enqueueSceneVideoPoll: jest.Mock }
  let service: SceneVideoWorkerService

  beforeEach(() => {
    creditsService = { consume: jest.fn(), refund: jest.fn() }
    storageService = {
      uploadObject: jest.fn().mockResolvedValue({
        objectKey: 'users/user-1/generated/videos/job-1.mp4',
      }),
      getObjectBytes: jest.fn(),
    }
    usageLogService = { record: jest.fn() }
    generationJobService = {
      getById: jest.fn(),
      update: jest
        .fn()
        .mockImplementation((_id: string, patch: Record<string, unknown>) =>
          Promise.resolve({ ...buildJob(), ...patch }),
        ),
    }
    videoProvider = { startSceneVideo: jest.fn(), checkOperation: jest.fn() }
    cloudTasksService = { enqueueSceneVideoPoll: jest.fn() }

    service = new SceneVideoWorkerService(
      configService,
      creditsService as never,
      storageService as never,
      usageLogService as never,
      generationJobService as never,
      videoProvider as never,
      cloudTasksService as never,
    )
  })

  describe('handleStart', () => {
    it('job이 없으면 아무 처리도 하지 않는다', async () => {
      generationJobService.getById.mockResolvedValue(null)

      await service.handleStart('missing-job', 0)

      expect(videoProvider.startSceneVideo).not.toHaveBeenCalled()
    })

    it('이미 QUEUED가 아니면(중복 재시도) Veo를 다시 호출하지 않는다', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({ status: 'PROCESSING' }),
      )

      await service.handleStart('job-1', 0)

      expect(videoProvider.startSceneVideo).not.toHaveBeenCalled()
    })

    it('성공하면 PROCESSING으로 바꾸고 첫 확인 task를 예약한다', async () => {
      generationJobService.getById.mockResolvedValue(buildJob())
      videoProvider.startSceneVideo.mockResolvedValue({
        providerOperationId: 'op-1',
        requestedDurationSeconds: 4,
        resolution: '720p',
      })

      await service.handleStart('job-1', 0)

      expect(generationJobService.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          status: 'PROCESSING',
          provider_operation_id: 'op-1',
        }),
      )
      expect(cloudTasksService.enqueueSceneVideoPoll).toHaveBeenCalledWith(
        'job-1',
        1,
        10,
      )
    })

    it('실패하고 마지막 시도가 아니면 에러를 던져 Cloud Tasks 자체 재시도에 맡긴다', async () => {
      generationJobService.getById.mockResolvedValue(buildJob())
      videoProvider.startSceneVideo.mockRejectedValue(new Error('일시적 오류'))

      await expect(service.handleStart('job-1', 0)).rejects.toThrow(
        '일시적 오류',
      )

      expect(creditsService.refund).not.toHaveBeenCalled()
      expect(generationJobService.update).not.toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({ status: 'FAILED' }),
      )
    })

    it('마지막 시도까지 실패하면 크레딧을 환불하고 FAILED로 확정하며 에러를 던지지 않는다', async () => {
      generationJobService.getById.mockResolvedValue(buildJob())
      videoProvider.startSceneVideo.mockRejectedValue(new Error('영구 오류'))

      // maxAttempts=3이므로 retryCount>=2가 마지막 시도
      await expect(service.handleStart('job-1', 2)).resolves.toBeUndefined()

      expect(creditsService.refund).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          idempotencyKey: 'ai-refund-failed-job-1',
        }),
      )
      expect(generationJobService.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({ status: 'FAILED' }),
      )
    })
  })

  describe('handlePoll', () => {
    it('PROCESSING 상태가 아니면(이미 종료됨) 아무 처리도 하지 않는다', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({ status: 'SUCCEEDED' }),
      )

      await service.handlePoll('job-1', 1)

      expect(videoProvider.checkOperation).not.toHaveBeenCalled()
    })

    it('아직 처리 중이면 다음 확인 task를 예약한다(실패로 취급하지 않음)', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({ status: 'PROCESSING', provider_operation_id: 'op-1' }),
      )
      videoProvider.checkOperation.mockResolvedValue({ done: false })

      await service.handlePoll('job-1', 1)

      expect(cloudTasksService.enqueueSceneVideoPoll).toHaveBeenCalledWith(
        'job-1',
        2,
        10,
      )
      expect(creditsService.refund).not.toHaveBeenCalled()
      expect(generationJobService.update).not.toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({ status: 'FAILED' }),
      )
    })

    it('폴링 상한을 넘기면 시간 초과로 실패 처리한다', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({ status: 'PROCESSING', provider_operation_id: 'op-1' }),
      )
      videoProvider.checkOperation.mockResolvedValue({ done: false })

      await service.handlePoll('job-1', 120)

      expect(cloudTasksService.enqueueSceneVideoPoll).not.toHaveBeenCalled()
      expect(creditsService.refund).toHaveBeenCalled()
      expect(generationJobService.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({ status: 'FAILED' }),
      )
    })

    it('완료+성공이면 R2에 업로드하고 크레딧을 소비하며 SUCCEEDED로 확정한다', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({
          status: 'PROCESSING',
          provider_operation_id: 'op-1',
          requested_duration_seconds: 4,
        }),
      )
      videoProvider.checkOperation.mockResolvedValue({
        done: true,
        success: true,
        videoBuffer: Buffer.from('fake-video'),
        mimeType: 'video/mp4',
      })

      await service.handlePoll('job-1', 3)

      expect(storageService.uploadObject).toHaveBeenCalledWith(
        'user-1',
        'generated/videos/job-1.mp4',
        expect.any(Buffer),
        'video/mp4',
      )
      expect(creditsService.consume).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          idempotencyKey: 'ai-consume-job-1',
        }),
      )
      expect(generationJobService.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({ status: 'SUCCEEDED' }),
      )
    })

    it('완료+실패면 크레딧을 환불하고 FAILED로 확정한다', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({ status: 'PROCESSING', provider_operation_id: 'op-1' }),
      )
      videoProvider.checkOperation.mockResolvedValue({
        done: true,
        success: false,
        errorMessage: '생성 실패',
      })

      await service.handlePoll('job-1', 3)

      expect(creditsService.refund).toHaveBeenCalled()
      expect(generationJobService.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          status: 'FAILED',
          error_message: '생성 실패',
        }),
      )
    })

    it('상태 확인 자체가 실패해도(네트워크 등) 다음 확인 task를 예약한다', async () => {
      generationJobService.getById.mockResolvedValue(
        buildJob({ status: 'PROCESSING', provider_operation_id: 'op-1' }),
      )
      videoProvider.checkOperation.mockRejectedValue(new Error('네트워크 오류'))

      await service.handlePoll('job-1', 1)

      expect(cloudTasksService.enqueueSceneVideoPoll).toHaveBeenCalledWith(
        'job-1',
        2,
        10,
      )
      expect(creditsService.refund).not.toHaveBeenCalled()
    })
  })
})
