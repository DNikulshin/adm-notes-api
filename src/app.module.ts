import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import { PrismaModule } from './prisma.module';
import { SeedingService } from './seeding.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TodosModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedingService],
})
export class AppModule {}
