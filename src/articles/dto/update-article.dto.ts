import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  MAX_ARTICLE_BODY_LENGTH,
  MAX_ARTICLE_DESCRIPTION_LENGTH,
  MAX_ARTICLE_TAG_LENGTH,
  MAX_ARTICLE_TAGS,
  MAX_ARTICLE_TITLE_LENGTH,
} from '../constants/articles.constants';

const isPresent = (_object: object, value: unknown): boolean =>
  value !== undefined;

export class UpdateArticleFieldsDto {
  @ApiPropertyOptional({
    example: 'Updated article content...',
    maxLength: MAX_ARTICLE_BODY_LENGTH,
  })
  @ValidateIf(isPresent)
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ARTICLE_BODY_LENGTH)
  body?: string;

  @ApiPropertyOptional({
    example: 'An updated introduction',
    maxLength: MAX_ARTICLE_DESCRIPTION_LENGTH,
  })
  @ValidateIf(isPresent)
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ARTICLE_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    example: ['nestjs', 'api'],
    items: { type: 'string', maxLength: MAX_ARTICLE_TAG_LENGTH },
    maxItems: MAX_ARTICLE_TAGS,
    type: [String],
  })
  @ValidateIf(isPresent)
  @IsArray()
  @IsString({ each: true })
  @MaxLength(MAX_ARTICLE_TAG_LENGTH, { each: true })
  @ArrayMaxSize(MAX_ARTICLE_TAGS)
  tagList?: string[];

  @ApiPropertyOptional({
    example: 'How to build a better NestJS API',
    maxLength: MAX_ARTICLE_TITLE_LENGTH,
  })
  @ValidateIf(isPresent)
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_ARTICLE_TITLE_LENGTH)
  title?: string;
}

export class UpdateArticleDto {
  @ApiProperty({ type: UpdateArticleFieldsDto })
  @IsDefined()
  @Type(() => UpdateArticleFieldsDto)
  @ValidateNested()
  article!: UpdateArticleFieldsDto;
}
