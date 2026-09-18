import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import {
  DEFAULT_COMMENTS_LIMIT,
  DEFAULT_COMMENTS_OFFSET,
  MAX_COMMENTS_LIMIT,
} from '../constants/comments.constants';
import type { CommentListQuery } from '../interfaces/comment.interface';

export class CommentQueryDto implements CommentListQuery {
  @ApiPropertyOptional({
    default: DEFAULT_COMMENTS_LIMIT,
    description: 'Number of comments to return',
    example: DEFAULT_COMMENTS_LIMIT,
    maximum: MAX_COMMENTS_LIMIT,
    minimum: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Max(MAX_COMMENTS_LIMIT)
  @Min(1)
  limit = DEFAULT_COMMENTS_LIMIT;

  @ApiPropertyOptional({
    default: DEFAULT_COMMENTS_OFFSET,
    description: 'Number of comments to skip',
    example: DEFAULT_COMMENTS_OFFSET,
    minimum: 0,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = DEFAULT_COMMENTS_OFFSET;
}
