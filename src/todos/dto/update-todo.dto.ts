import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTodoDto {
  @ApiProperty({ example: 'Buy bread', description: 'The title of the todo' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: true, description: 'Whether the todo is completed' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
