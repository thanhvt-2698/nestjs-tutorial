import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'jake@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 12, maxLength: 72 })
  @IsString()
  @Length(12, 72)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ type: LoginUserDto })
  @IsDefined()
  @Type(() => LoginUserDto)
  @ValidateNested()
  user!: LoginUserDto;
}
