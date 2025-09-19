import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedingService } from './seeding.service';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';

config();

async function bootstrap() {
  const logger = new Logger('Seeding');
  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log('Starting the seeding process...');

  try {
    const seeder = app.get(SeedingService);
    await seeder.seedAdmin();
    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding failed!', error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();
