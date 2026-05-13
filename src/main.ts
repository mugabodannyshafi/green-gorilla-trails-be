import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@rwanda360/rwanda360-service-sdk';

/** Comma-separated origins. If unset, uses defaults for local + known deploy hosts. */
function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return [
    'http://localhost:3000',
    'https://green-gorilla-trails.vercel.app',
    'https://www.greengorillatrails.com',
    'https://greengorillatrails.com',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Green Gorilla Trails API Documentation')
      .setDescription(
        'A professional content management system for tourism operations specializing in Rwanda gorilla trekking and East Africa safaris.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    app.useGlobalFilters(new AllExceptionsFilter());
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        operationsSorter: 'alpha',
        filter: true,
        displayOperationId: true,
      },
    });
  }
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api`);
}
bootstrap();
