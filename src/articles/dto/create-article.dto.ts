import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  MAX_ARTICLE_BODY_LENGTH,
  MAX_ARTICLE_DESCRIPTION_LENGTH,
  MAX_ARTICLE_TAG_LENGTH,
  MAX_ARTICLE_TAGS,
  MAX_ARTICLE_TITLE_LENGTH,
} from '../constants/articles.constants';

export class CreateArticleFieldsDto {
  @ApiProperty({
    example: 'Article content...',
    maxLength: MAX_ARTICLE_BODY_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ARTICLE_BODY_LENGTH)
  body!: string;

  @ApiProperty({
    example: 'A short introduction',
    maxLength: MAX_ARTICLE_DESCRIPTION_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ARTICLE_DESCRIPTION_LENGTH)
  description!: string;

  @ApiPropertyOptional({
    example: ['nestjs', 'typescript'],
    items: { type: 'string', maxLength: MAX_ARTICLE_TAG_LENGTH },
    maxItems: MAX_ARTICLE_TAGS,
    type: [String],
  })
  @ArrayMaxSize(MAX_ARTICLE_TAGS)
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(MAX_ARTICLE_TAG_LENGTH, { each: true })
  tagList?: string[];

  @ApiProperty({
    example: 'How to build a NestJS API',
    maxLength: MAX_ARTICLE_TITLE_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ARTICLE_TITLE_LENGTH)
  title!: string;
}

export class CreateArticleDto {
  @ApiProperty({ type: CreateArticleFieldsDto })
  @IsDefined()
  @Type(() => CreateArticleFieldsDto)
  @ValidateNested()
  article!: CreateArticleFieldsDto;
}
