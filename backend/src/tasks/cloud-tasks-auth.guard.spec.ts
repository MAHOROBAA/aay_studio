import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CloudTasksAuthGuard } from './cloud-tasks-auth.guard'

const verifyIdTokenMock = jest.fn<Promise<unknown>, [unknown]>()

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: (arg: unknown): Promise<unknown> => verifyIdTokenMock(arg),
  })),
}))

describe('CloudTasksAuthGuard', () => {
  const fakeConfig: Record<string, string> = {
    CLOUD_RUN_SERVICE_URL: 'https://aay-backend.example.run.app',
    CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT_EMAIL:
      'aay-studio-run-sa@aay-project.iam.gserviceaccount.com',
  }
  const configService = {
    getOrThrow: (key: string) => fakeConfig[key],
  } as unknown as ConfigService

  let guard: CloudTasksAuthGuard

  beforeEach(() => {
    verifyIdTokenMock.mockReset()
    guard = new CloudTasksAuthGuard(configService)
  })

  function buildContext(authorizationHeader?: string): ExecutionContext {
    const request = {
      headers: { authorization: authorizationHeader },
      originalUrl: '/internal/tasks/scene-video/start',
    }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext
  }

  it('Authorization 헤더가 없으면 거부한다', async () => {
    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('audience가 요청 전체 URL과 정확히 일치하는지 검증한다', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'aay-studio-run-sa@aay-project.iam.gserviceaccount.com',
        email_verified: true,
      }),
    })

    await guard.canActivate(buildContext('Bearer valid-token'))

    expect(verifyIdTokenMock).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience:
        'https://aay-backend.example.run.app/internal/tasks/scene-video/start',
    })
  })

  it('토큰의 서비스 계정 이메일이 다르면 거부한다', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'someone-else@another-project.iam.gserviceaccount.com',
        email_verified: true,
      }),
    })

    await expect(
      guard.canActivate(buildContext('Bearer valid-token')),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('email_verified가 false면 거부한다', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'aay-studio-run-sa@aay-project.iam.gserviceaccount.com',
        email_verified: false,
      }),
    })

    await expect(
      guard.canActivate(buildContext('Bearer valid-token')),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('토큰 검증 자체가 실패하면(위조/만료 등) 거부한다', async () => {
    verifyIdTokenMock.mockRejectedValue(new Error('invalid token signature'))

    await expect(
      guard.canActivate(buildContext('Bearer bad-token')),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('올바른 토큰이면 통과한다', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'aay-studio-run-sa@aay-project.iam.gserviceaccount.com',
        email_verified: true,
      }),
    })

    await expect(
      guard.canActivate(buildContext('Bearer valid-token')),
    ).resolves.toBe(true)
  })
})
