import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { CreditsController } from './credits.controller'
import { CreditsService } from './credits.service'

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
