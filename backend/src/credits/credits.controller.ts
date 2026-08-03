import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { RequestUser } from '../auth/auth.types'
import { CreditsService } from './credits.service'
import type { CreditBalance } from './credits.types'

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMyBalance(@CurrentUser() user: RequestUser): Promise<CreditBalance> {
    return this.creditsService.getBalance(user.id)
  }
}
