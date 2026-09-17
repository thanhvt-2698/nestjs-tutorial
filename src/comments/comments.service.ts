import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from '../articles/entities/article.entity';
import { DEFAULT_PROFILE_FOLLOWING_STATUS } from '../users/constants/users.constants';
import { UserEntity } from '../users/entities/user.entity';
import { CommentEntity } from './entities/comment.entity';
import { COMMENT_LIST_ORDER_DIRECTION } from './constants/comments.constants';
import {
  CommentResponse,
  CommentResponseEnvelope,
  CommentListResponse,
  CreateCommentInput,
} from './interfaces/comment.interface';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articlesRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findByArticle(slug: string): Promise<CommentListResponse> {
    const article = await this.findArticleOrThrow(slug);
    const comments = await this.commentsRepository.find({
      order: {
        createdAt: COMMENT_LIST_ORDER_DIRECTION,
        id: COMMENT_LIST_ORDER_DIRECTION,
      },
      relations: { author: true },
      select: {
        author: {
          bio: true,
          image: true,
          username: true,
        },
        body: true,
        createdAt: true,
        id: true,
        updatedAt: true,
      },
      where: { article: { id: article.id } },
    });

    return {
      comments: comments.map((comment) => this.toResponse(comment)),
    };
  }

  async create(
    slug: string,
    authorId: string,
    input: CreateCommentInput,
  ): Promise<CommentResponseEnvelope> {
    const [article, author] = await Promise.all([
      this.findArticleOrThrow(slug),
      this.usersRepository.findOne({
        select: {
          bio: true,
          id: true,
          image: true,
          username: true,
        },
        where: { id: authorId },
      }),
    ]);

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const body = input.body.trim();

    if (!body) {
      throw new BadRequestException('Comment body must not be empty');
    }

    const comment = this.commentsRepository.create({
      article,
      author,
      body,
    });
    const savedComment = await this.commentsRepository.save(comment);

    return { comment: this.toResponse(savedComment) };
  }

  async remove(
    slug: string,
    commentId: string,
    authorId: string,
  ): Promise<void> {
    const article = await this.findArticleOrThrow(slug);
    const comment = await this.commentsRepository.findOne({
      relations: { author: true },
      select: {
        author: { id: true },
        id: true,
      },
      where: {
        article: { id: article.id },
        id: commentId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== authorId) {
      throw new ForbiddenException('Only the comment author can delete it');
    }

    await this.commentsRepository.remove(comment);
  }

  private async findArticleOrThrow(slug: string): Promise<ArticleEntity> {
    const article = await this.articlesRepository.findOne({
      select: { id: true },
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private toResponse(comment: CommentEntity): CommentResponse {
    return {
      author: {
        bio: comment.author.bio,
        following: DEFAULT_PROFILE_FOLLOWING_STATUS,
        image: comment.author.image,
        username: comment.author.username,
      },
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      id: comment.id,
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
