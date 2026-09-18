import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_COMMENT_BODY_LENGTH } from '../constants/comments.constants';

export class CreateCommentFieldsDto {
  @ApiProperty({
    example: 'This is useful, thank you!',
    maxLength: MAX_COMMENT_BODY_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_COMMENT_BODY_LENGTH)
  body!: string;
}

export class CreateCommentDto {
  @ApiProperty({ type: CreateCommentFieldsDto })
  @IsDefined()
  @Type(() => CreateCommentFieldsDto)
  @ValidateNested()
  comment!: CreateCommentFieldsDto;
}
