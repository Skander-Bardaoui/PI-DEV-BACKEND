// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // This makes class-validator decorators actually work on request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strips properties not in the DTO
      forbidNonWhitelisted: true, // throws error if extra properties sent
      transform: true,       // auto-converts types (e.g. string "5" → number 5)
    }),
  );

  // Allow React dev server to hit this backend.
  // Vite defaults to port 5173. If yours is different, change it here.
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}

bootstrap();