import { ApiProperty } from '@nestjs/swagger';
import type { CommentResponse } from '../interfaces/comment.interface';

export class CommentAuthorResponseDto {
  @ApiProperty({ example: null, nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({ example: false })
  following!: boolean;

  @ApiProperty({ example: null, nullable: true, type: String })
  image!: string | null;

  @ApiProperty({ example: 'jake' })
  username!: string;
}

export class CommentResponseDataDto implements CommentResponse {
  @ApiProperty({ type: CommentAuthorResponseDto })
  author!: CommentAuthorResponseDto;

  @ApiProperty({ example: 'This is useful, thank you!' })
  body!: string;

  @ApiProperty({ example: '2026-09-16T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({
    format: 'uuid',
    example: 'c7a2d2c3-3f8a-4c8d-9d7a-3c3f22f9a3f8',
  })
  id!: string;

  @ApiProperty({ example: '2026-09-16T10:00:00.000Z', format: 'date-time' })
  updatedAt!: string;
}

export class CommentResponseDto {
  @ApiProperty({ type: CommentResponseDataDto })
  comment!: CommentResponseDataDto;
}

export class CommentListResponseDto {
  @ApiProperty({ isArray: true, type: CommentResponseDataDto })
  comments!: CommentResponseDataDto[];
}
