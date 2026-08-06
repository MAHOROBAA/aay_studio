import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // YouTube 연결 쿠키(HttpOnly)를 프론트에서 credentials: 'include'로 보내려면 와일드카드
  // origin을 쓸 수 없다 — 허용 목록으로 제한한다.
  const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_DEV_ORIGIN,
  ].filter((origin): origin is string => Boolean(origin))
  app.enableCors({ origin: allowedOrigins, credentials: true })
  await app.listen(process.env.PORT ?? 8080)
}
void bootstrap()
