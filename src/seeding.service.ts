import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(private readonly usersService: UsersService) {}

  async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      this.logger.error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env file',
      );
      return;
    }

    const adminExists = await this.usersService.findByEmail(adminEmail);

    if (adminExists) {
      this.logger.log('Admin user already exists. Skipping creation.');
      return;
    }

    try {
      await this.usersService.create(
        { email: adminEmail, password: adminPassword },
        UserRole.ADMIN,
      );
      this.logger.log(`Admin user "${adminEmail}" created successfully.`);
    } catch (error) {
      this.logger.error('Failed to create admin user.', error.stack);
    }
  }
}
