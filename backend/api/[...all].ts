import 'reflect-metadata';
import type { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

let cachedApp: ((req: Request, res: Response) => void) | null = null;

async function bootstrap() {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  await app.init();

  cachedApp = app.getHttpAdapter().getInstance();
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  const app = await bootstrap();

  if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
  }

  return app(req, res);
}