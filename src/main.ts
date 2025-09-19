import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SeedingService } from './seeding.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Seed the database
  const seeder = app.get(SeedingService);
  await seeder.seedAdmin();

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription(
      'A simple API for managing a to-do list, built with NestJS.',
    )
    .setVersion('1.0')
    .addTag('todos')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // CORS
  app.enableCors({
    // credentials: true
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`
    Server is running on http://localhost:${port}
    Docs -  http://localhost:${port}/docs
    OpenApi -  http://localhost:${port}/docs-json
    `);
}
bootstrap();
