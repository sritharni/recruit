import 'reflect-metadata';
import express from 'express';
import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

const expressApp = express();

let cachedServer: ReturnType<typeof serverless> | null = null;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();

  await app.init();

  cachedServer = serverless(expressApp);
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}