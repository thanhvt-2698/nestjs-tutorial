import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { noCacheHeaders } from '../common/decorators/no-cache-headers.decorator';
import type { AuthenticatedUser } from '../users/interfaces/user.interface';
import { ArticlesService } from './articles.service';
import { ArticleResponseDto } from './dto/article-response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('api/articles')
@ApiTags('Articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Create an article' })
  @ApiBody({ type: CreateArticleDto })
  @ApiCreatedResponse({
    description: 'Article created',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateArticleDto,
  ) {
    return this.articlesService
      .create(user.id, body.article)
      .then((article) => ({
        article,
      }));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an article by slug' })
  @ApiOkResponse({ description: 'Article details', type: ArticleResponseDto })
  @ApiNotFoundResponse({ description: 'Article not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService
      .findBySlug(slug)
      .then((article) => ({ article }));
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update an article owned by the current user' })
  @ApiBody({ type: UpdateArticleDto })
  @ApiOkResponse({ description: 'Article updated', type: ArticleResponseDto })
  @ApiForbiddenResponse({ description: 'The current user is not the author' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  update(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateArticleDto,
  ) {
    return this.articlesService
      .update(slug, user.id, body.article)
      .then((article) => ({ article }));
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Delete an article owned by the current user' })
  @ApiNoContentResponse({ description: 'Article deleted' })
  @ApiForbiddenResponse({ description: 'The current user is not the author' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async remove(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.articlesService.remove(slug, user.id);
  }
}
