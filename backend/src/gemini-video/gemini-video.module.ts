import { Module } from '@nestjs/common'
import { GeminiVideoProvider } from './gemini-video.provider'

@Module({
  providers: [GeminiVideoProvider],
  exports: [GeminiVideoProvider],
})
export class GeminiVideoModule {}
