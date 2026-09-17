import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  DEFAULT_ARTICLE_FAVORITED_STATUS,
  DEFAULT_ARTICLE_FAVORITES_COUNT,
  MAX_ARTICLE_SLUG_LENGTH,
} from './constants/articles.constants';
import {
  DEFAULT_PROFILE_FOLLOWING_STATUS,
  POSTGRES_UNIQUE_VIOLATION_CODE,
} from '../users/constants/users.constants';
import { ArticlesDatabaseOperationError } from './database-operation.error';
import { UserEntity } from '../users/entities/user.entity';
import { ArticleEntity } from './entities/article.entity';
import {
  ArticleResponse,
  ArticleResponseEnvelope,
  CreateArticleInput,
  UpdateArticleInput,
} from './interfaces/article.interface';
import { normalizeTagList, slugify } from '../common/util/article.util';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articlesRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly logger: Logger,
  ) {}

  async create(
    authorId: string,
    input: CreateArticleInput,
  ): Promise<ArticleResponseEnvelope> {
    const author = await this.usersRepository.findOne({
      select: {
        bio: true,
        id: true,
        image: true,
        username: true,
      },
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const article = this.articlesRepository.create({
      author,
      body: input.body.trim(),
      description: input.description.trim(),
      favoritesCount: DEFAULT_ARTICLE_FAVORITES_COUNT,
      slug: await this.generateUniqueSlug(input.title),
      tagList: normalizeTagList(input.tagList),
      title: input.title.trim(),
    });

    try {
      const savedArticle = await this.articlesRepository.save(article);

      return this.toResponseEnvelope(savedArticle);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        this.logger.warn({
          message: 'Rejected article because its slug was already created',
          operation: 'ArticlesService.create',
          slug: article.slug,
        });
        throw new ConflictException({
          error: 'ArticleConflict',
          guidance: 'Retry the request with a different title',
          message: 'Unable to generate a unique article slug',
        });
      }

      this.logger.error({
        error: this.getErrorDetails(error),
        message: 'Failed to persist article',
        operation: 'ArticlesService.create',
        slug: article.slug,
      });
      throw new ArticlesDatabaseOperationError('Unable to create article', {
        cause: error,
      });
    }
  }

  async findBySlug(slug: string): Promise<ArticleResponseEnvelope> {
    const article = await this.findArticleOrThrow(slug);

    return this.toResponseEnvelope(article);
  }

  async update(
    slug: string,
    authorId: string,
    input: UpdateArticleInput,
  ): Promise<ArticleResponseEnvelope> {
    const article = await this.findArticleOrThrow(slug);

    this.assertOwnership(article, authorId);

    if (input.body !== undefined) {
      article.body = input.body.trim();
    }

    if (input.description !== undefined) {
      article.description = input.description.trim();
    }

    if (input.tagList !== undefined) {
      article.tagList = normalizeTagList(input.tagList);
    }

    if (input.title !== undefined) {
      article.title = input.title.trim();
    }

    const savedArticle = await this.articlesRepository.save(article);

    return this.toResponseEnvelope(savedArticle);
  }

  async remove(slug: string, authorId: string): Promise<void> {
    const article = await this.findArticleOrThrow(slug);

    this.assertOwnership(article, authorId);
    await this.articlesRepository.remove(article);
  }

  private async findArticleOrThrow(slug: string): Promise<ArticleEntity> {
    const article = await this.articlesRepository.findOne({
      relations: { author: true },
      select: {
        author: {
          bio: true,
          id: true,
          image: true,
          username: true,
        },
        body: true,
        createdAt: true,
        description: true,
        favoritesCount: true,
        id: true,
        slug: true,
        tagList: true,
        title: true,
        updatedAt: true,
      },
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private assertOwnership(article: ArticleEntity, authorId: string): void {
    if (article.author.id !== authorId) {
      throw new ForbiddenException('Only the article author can modify it');
    }
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.slugExists(candidate)) {
      const suffixText = `-${suffix}`;
      const baseLength = MAX_ARTICLE_SLUG_LENGTH - suffixText.length;

      candidate = `${baseSlug.slice(0, baseLength)}${suffixText}`;
      suffix += 1;
    }

    return candidate;
  }

  private async slugExists(slug: string): Promise<boolean> {
    const article = await this.articlesRepository.findOne({
      select: { id: true },
      where: { slug },
    });

    return article !== null;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };

    return driverError.code === POSTGRES_UNIQUE_VIOLATION_CODE;
  }

  private getErrorDetails(error: unknown): Record<string, string> {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack ?? '',
      };
    }

    return { message: String(error) };
  }

  private toResponse(article: ArticleEntity): ArticleResponse {
    return {
      author: {
        bio: article.author.bio,
        following: DEFAULT_PROFILE_FOLLOWING_STATUS,
        image: article.author.image,
        username: article.author.username,
      },
      body: article.body,
      createdAt: article.createdAt.toISOString(),
      description: article.description,
      favorited: DEFAULT_ARTICLE_FAVORITED_STATUS,
      favoritesCount: article.favoritesCount,
      slug: article.slug,
      tagList: article.tagList,
      title: article.title,
      updatedAt: article.updatedAt.toISOString(),
    };
  }

  private toResponseEnvelope(article: ArticleEntity): ArticleResponseEnvelope {
    return { article: this.toResponse(article) };
  }
}
