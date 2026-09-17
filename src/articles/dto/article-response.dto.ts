import { ApiProperty } from '@nestjs/swagger';
import type { ArticleResponse } from '../interfaces/article.interface';

export class ArticleAuthorResponseDto {
  @ApiProperty({ example: null, nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({ example: false })
  following!: boolean;

  @ApiProperty({ example: null, nullable: true, type: String })
  image!: string | null;

  @ApiProperty({ example: 'jake' })
  username!: string;
}

export class ArticleResponseDataDto implements ArticleResponse {
  @ApiProperty({ type: ArticleAuthorResponseDto })
  author!: ArticleAuthorResponseDto;

  @ApiProperty({ example: 'Article content...' })
  body!: string;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: 'A short introduction' })
  description!: string;

  @ApiProperty({ example: false })
  favorited!: boolean;

  @ApiProperty({ example: 0 })
  favoritesCount!: number;

  @ApiProperty({ example: 'how-to-build-a-nestjs-api' })
  slug!: string;

  @ApiProperty({ example: ['nestjs', 'typescript'], type: [String] })
  tagList!: string[];

  @ApiProperty({ example: 'How to build a NestJS API' })
  title!: string;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z', format: 'date-time' })
  updatedAt!: string;
}

export class ArticleResponseDto {
  @ApiProperty({ type: ArticleResponseDataDto })
  article!: ArticleResponseDataDto;
}
