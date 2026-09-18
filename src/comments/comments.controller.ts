import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { noCacheHeaders } from '../common/decorators/no-cache-headers.decorator';
import type { AuthenticatedUser } from '../users/interfaces/user.interface';
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import {
  CommentListResponseDto,
  CommentResponseDto,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('api/articles/:slug/comments')
@ApiTags('Comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @noCacheHeaders()
  @ApiOperation({ summary: 'List comments for an article' })
  @ApiParam({
    description: 'Article slug',
    example: 'how-to-build-a-nestjs-api',
    name: 'slug',
  })
  @ApiOkResponse({
    description: 'Article comments',
    type: CommentListResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiBadRequestResponse({ description: 'Invalid pagination query' })
  findByArticle(@Param('slug') slug: string, @Query() query: CommentQueryDto) {
    return this.commentsService.findByArticle(slug, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Create a comment on an article' })
  @ApiParam({
    description: 'Article slug',
    example: 'how-to-build-a-nestjs-api',
    name: 'slug',
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({
    description: 'Comment created',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  create(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCommentDto,
  ) {
    return this.commentsService.create(slug, user.id, body.comment);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Delete an owned article comment' })
  @ApiParam({
    description: 'Article slug',
    example: 'how-to-build-a-nestjs-api',
    name: 'slug',
  })
  @ApiParam({
    description: 'Comment UUID',
    example: 'c7a2d2c3-3f8a-4c8d-9d7a-3c3f22f9a3f8',
    name: 'id',
  })
  @ApiNoContentResponse({ description: 'Comment deleted' })
  @ApiForbiddenResponse({
    description: 'The current user is not the comment author',
  })
  @ApiNotFoundResponse({ description: 'Article or comment not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  remove(
    @Param('slug') slug: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.commentsService.remove(slug, commentId, user.id);
  }
}
