import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticleEntity } from './entities/article.entity';

@Module({
  controllers: [ArticlesController],
  imports: [TypeOrmModule.forFeature([ArticleEntity, UserEntity])],
  providers: [ArticlesService, Logger],
})
export class ArticlesModule {}
