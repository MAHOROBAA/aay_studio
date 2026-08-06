import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SupabaseModule } from '../supabase/supabase.module'
import { YoutubeConnectionService } from './youtube-connection.service'
import { YoutubeOAuthStateService } from './youtube-oauth-state.service'
import { YoutubeTokenEncryptionService } from './youtube-token-encryption.service'
import { YoutubeController } from './youtube.controller'
import { YoutubeService } from './youtube.service'

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [YoutubeController],
  providers: [
    YoutubeService,
    YoutubeConnectionService,
    YoutubeOAuthStateService,
    YoutubeTokenEncryptionService,
  ],
  exports: [YoutubeConnectionService, YoutubeTokenEncryptionService],
})
export class YoutubeModule {}
