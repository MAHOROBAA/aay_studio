import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  // SupabaseModule 등 실제 외부 연동 모듈은 각 Step에서 필요한 자격 증명이 준비되는 대로 여기에 추가한다.
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
