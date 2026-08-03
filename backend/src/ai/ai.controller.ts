import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { RequestUser } from '../auth/auth.types'
import { AiService } from './ai.service'
import type {
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
}
