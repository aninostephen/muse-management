import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const frontendUrl = configService.get<string>(
    'frontendUrl',
    'http://localhost:5173',
  );

  // Global prefix for all backend REST endpoints
  app.setGlobalPrefix('api');

  const allowedOrigins = frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // CORS configuration supporting local Vite dev and reverse-proxied production domains
  // (POST is permitted exclusively for /api/auth/login; Infloww API remains strictly GET-only)
  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !requestOrigin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(requestOrigin) ||
        requestOrigin.startsWith('http://localhost:') ||
        requestOrigin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true);
        return;
      }
      callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global DTO validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter that never exposes credentials
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger OpenAPI documentation at /api/docs with JWT Bearer Auth
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Agency Management Dashboard API')
    .setDescription(
      'JWT-Authenticated Read-Only NestJS Backend API integrating with Infloww OpenAPI v1.4 for Creator, Chatter, Revenue, and Marketing Analytics.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`Backend running at http://localhost:${port}/api`);
  logger.log(`Swagger documentation at http://localhost:${port}/api/docs`);
}

bootstrap();
