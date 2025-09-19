import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'your-refresh-token', description: 'The refresh token to get a new access token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
