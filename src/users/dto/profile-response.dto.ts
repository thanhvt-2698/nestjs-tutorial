import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({ example: 'jake' })
  username!: string;

  @ApiProperty({ example: 'Backend developer', nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({ example: null, nullable: true, type: String })
  image!: string | null;

  @ApiProperty({ example: false })
  following!: boolean;
}

export class ProfileResponseDto {
  @ApiProperty({ type: ProfileDto })
  profile!: ProfileDto;
}
