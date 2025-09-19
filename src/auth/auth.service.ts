import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService, JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<User, 'password'>): Promise<{ accessToken: string; refreshToken: string }> {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }
    return this.generateAndSaveTokens(fullUser);
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'a-very-secret-key-that-is-long' });

      if (payload.type !== 'refresh') {
        throw new ForbiddenException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== token) {
        throw new ForbiddenException('Invalid refresh token');
      }

      if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
        await this.usersService.update(user.id, { refreshToken: null, refreshTokenExpiresAt: null });
        throw new ForbiddenException('Refresh token expired');
      }

      return this.generateAndSaveTokens(user);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException('Refresh token expired');
      } else if (e instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      } else {
        throw e;
      }
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.update(userId, { refreshToken: null, refreshTokenExpiresAt: null });
    return { message: 'Successfully logged out' };
  }

  async generateAndSaveTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload = { sub: user.id, email: user.email, role: user.role, type: 'access' };
    const refreshPayload = { sub: user.id, type: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload, { secret: process.env.JWT_SECRET || 'a-very-secret-key-that-is-long', expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_SECRET || 'a-very-secret-key-that-is-long',
      expiresIn: '7d',
    });

    await this.usersService.update(user.id, { refreshToken, refreshTokenExpiresAt: this.getRefreshTokenExpiry() });

    return {
      accessToken,
      refreshToken,
    };
  }

  private getRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}
