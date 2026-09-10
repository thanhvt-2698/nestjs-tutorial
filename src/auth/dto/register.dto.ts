import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'jake@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 12, maxLength: 72 })
  @IsString()
  @Length(12, 72)
  password!: string;

  @ApiProperty({
    description: 'Username containing 3 to 30 letters, numbers, or underscores',
    example: 'jake',
    maxLength: 30,
  })
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only letters, numbers, and underscores',
  })
  username!: string;
}

export class RegisterDto {
  @ApiProperty({ type: RegisterUserDto })
  @IsDefined()
  @Type(() => RegisterUserDto)
  @ValidateNested()
  user!: RegisterUserDto;
}
