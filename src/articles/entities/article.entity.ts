import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'articles' })
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_articles_slug_unique', { unique: true })
  @Column({ length: 255, type: 'varchar' })
  slug!: string;

  @Column({ length: 200, type: 'varchar' })
  title!: string;

  @Column({ length: 500, type: 'varchar' })
  description!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({
    array: true,
    default: () => "'{}'",
    name: 'tag_list',
    type: 'text',
  })
  tagList!: string[];

  @Column({ default: 0, name: 'favorites_count', type: 'integer' })
  favoritesCount!: number;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: UserEntity;

  @RelationId((article: ArticleEntity) => article.author)
  authorId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
