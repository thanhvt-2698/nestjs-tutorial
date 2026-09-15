import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class UpdateUserFieldsDto {
  @ApiPropertyOptional({
    description: 'Username containing 3 to 30 letters, numbers, or underscores',
    example: 'new_jake',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only letters, numbers, and underscores',
  })
  username?: string;

  @ApiPropertyOptional({
    example: 'NewPassword123!',
    minLength: 12,
    maxLength: 72,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(12, 72)
  password?: string;

  @ApiPropertyOptional({ example: 'Backend developer', nullable: true })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    maxLength: 2048,
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  image?: string | null;
}

export class UpdateUserDto {
  @ApiProperty({ type: UpdateUserFieldsDto })
  @IsDefined()
  @Type(() => UpdateUserFieldsDto)
  @ValidateNested()
  user!: UpdateUserFieldsDto;
}
