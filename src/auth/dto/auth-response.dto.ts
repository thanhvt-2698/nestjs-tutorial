import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'jake@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'jake' })
  username!: string;

  @ApiProperty({ example: null, nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({ example: null, nullable: true, type: String })
  image!: string | null;
}

export class AuthUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class CurrentUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
