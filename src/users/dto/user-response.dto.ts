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
