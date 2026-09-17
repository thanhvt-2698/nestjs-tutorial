import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  DEFAULT_ARTICLES_LIMIT,
  DEFAULT_ARTICLES_OFFSET,
  MAX_ARTICLES_LIMIT,
} from '../constants/articles.constants';
import type { ArticleListQuery } from '../interfaces/article.interface';

const trimQueryValue = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ArticleQueryDto implements ArticleListQuery {
  @ApiPropertyOptional({
    description: 'Filter articles by the author username',
    example: 'jake',
  })
  @IsOptional()
  @IsString()
  @Transform(trimQueryValue)
  author?: string;

  @ApiPropertyOptional({
    default: DEFAULT_ARTICLES_LIMIT,
    description: 'Number of articles to return',
    example: DEFAULT_ARTICLES_LIMIT,
    maximum: MAX_ARTICLES_LIMIT,
    minimum: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Max(MAX_ARTICLES_LIMIT)
  @Min(1)
  limit = DEFAULT_ARTICLES_LIMIT;

  @ApiPropertyOptional({
    default: DEFAULT_ARTICLES_OFFSET,
    description: 'Number of articles to skip',
    example: DEFAULT_ARTICLES_OFFSET,
    minimum: 0,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = DEFAULT_ARTICLES_OFFSET;

  @ApiPropertyOptional({
    description: 'Filter articles by tag',
    example: 'nestjs',
  })
  @IsOptional()
  @IsString()
  @Transform(trimQueryValue)
  tag?: string;
}
