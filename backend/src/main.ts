import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // 폐쇄형 베타 단계라 우선 전체 허용 — 프론트 배포 도메인이 정해지면 origin을 제한한다.
  app.enableCors()
  await app.listen(process.env.PORT ?? 8080)
}
void bootstrap()
