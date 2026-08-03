import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { RequestUser } from '../auth/auth.types'
import { AiService } from './ai.service'
import type {
  CharacterImageInput,
  GeneratedImageResult,
  GenerationJobStatus,
  GenerationJobSummary,
  SceneImageInput,
  SceneVideoInput,
  StoryGenerationInput,
  StoryResult,
  WorldGenerationInput,
  WorldResult,
} from './ai.types'

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('worlds/generate')
  generateWorld(
    @CurrentUser() user: RequestUser,
    @Body() body: WorldGenerationInput,
  ): Promise<WorldResult> {
    return this.aiService.generateWorld(user.id, body)
  }

  @Post('stories/generate')
  generateStory(
    @CurrentUser() user: RequestUser,
    @Body() body: StoryGenerationInput,
  ): Promise<StoryResult> {
    return this.aiService.generateStory(user.id, body)
  }

  @Post('characters/generate-image')
  generateCharacterImage(
    @CurrentUser() user: RequestUser,
    @Body() body: CharacterImageInput,
  ): Promise<GeneratedImageResult> {
    return this.aiService.generateCharacterImage(user.id, body)
  }

  @Post('scenes/generate-image')
  generateSceneImage(
    @CurrentUser() user: RequestUser,
    @Body() body: SceneImageInput,
  ): Promise<GeneratedImageResult> {
    return this.aiService.generateSceneImage(user.id, body)
  }

  @Post('videos/generate')
  requestSceneVideo(
    @CurrentUser() user: RequestUser,
    @Body() body: SceneVideoInput,
  ): Promise<{ jobId: string; status: GenerationJobStatus }> {
    return this.aiService.requestSceneVideo(user.id, body)
  }

  @Get('videos/jobs/:jobId')
  getSceneVideoJob(
    @CurrentUser() user: RequestUser,
    @Param('jobId') jobId: string,
  ): Promise<GenerationJobSummary> {
    return this.aiService.getSceneVideoJob(user.id, jobId)
  }
}
