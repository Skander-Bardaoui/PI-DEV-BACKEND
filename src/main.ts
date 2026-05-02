// src/main.ts

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ZodValidationPipe as NestJsZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import * as express from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔐 Security
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser());

  // ✅ Stripe raw body handling
  app.use((req, res, next) => {
    if (req.originalUrl === '/webhooks/stripe') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  });

  app.use(express.urlencoded({ extended: true }));

  // Static files
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  // Validation
  app.useGlobalPipes(
    new NestJsZodValidationPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => ({
          field: err.property,
          messages: Object.values(err.constraints ?? {}),
        }));

        return new BadRequestException({
          statusCode: 400,
          error: 'Validation échouée',
          details: messages,
          message: messages.flatMap((m) => m.messages),
        });
      },
    }),
  );

  // ✅ CORS
  const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // ✅ IMPORTANT: Render PORT
  const PORT = process.env.PORT || 3001;

  await app.listen(PORT);

  console.log(`🚀 Backend running on port ${PORT}`);
}

bootstrap();
