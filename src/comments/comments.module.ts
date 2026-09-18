import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from '../articles/entities/article.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentEntity } from './entities/comment.entity';

@Module({
  controllers: [CommentsController],
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, CommentEntity, UserEntity]),
  ],
  providers: [CommentsService],
})
export class CommentsModule {}
