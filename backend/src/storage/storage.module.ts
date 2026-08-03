import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { StorageController } from './storage.controller'
import { StorageService } from './storage.service'

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
