import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
