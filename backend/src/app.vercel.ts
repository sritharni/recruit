import type { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let cachedApp: (req: Request, res: Response) => void;

async function bootstrap() {
  if (cachedApp) return cachedApp;
  const t0 = Date.now();
  console.log(`[TIMING] bootstrap start`);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.init();
  cachedApp = app.getHttpAdapter().getInstance();
  console.log(`[TIMING] bootstrap done +${Date.now() - t0}ms`);
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  const t0 = Date.now();
  const method = req.method ?? '?';
  const url = req.url ?? '/';
  console.log(`[TIMING] request start ${method} ${url}`);
  const app = await bootstrap();
  const out = app(req, res);
  console.log(`[TIMING] request handed to Nest +${Date.now() - t0}ms ${method} ${url}`);
  return out;
}
