import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // 와일드카드 대신 실제 프론트 배포 origin만 허용한다.
  const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_DEV_ORIGIN,
  ].filter((origin): origin is string => Boolean(origin))
  app.enableCors({ origin: allowedOrigins })
  await app.listen(process.env.PORT ?? 8080)
}
void bootstrap()
