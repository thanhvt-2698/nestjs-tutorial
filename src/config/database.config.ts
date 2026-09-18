import 'dotenv/config';

import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { ArticleEntity } from '../articles/entities/article.entity';
import { CommentEntity } from '../comments/entities/comment.entity';
import { UserEntity } from '../users/entities/user.entity';

const parsePort = (value: string | undefined, fallback: number): number => {
  const port = Number(value ?? fallback);

  return Number.isInteger(port) && port > 0 ? port : fallback;
};

export function getDatabaseOptions(): DataSourceOptions {
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const databaseName = process.env.DB_NAME ?? 'nestjs_tutorial';

  return {
    database: isTestEnvironment
      ? (process.env.DB_TEST_NAME ?? `${databaseName}_test`)
      : databaseName,
    entities: [ArticleEntity, CommentEntity, UserEntity],
    host: process.env.DB_HOST ?? 'localhost',
    migrations: [join(__dirname, '../database/migrations/*{.js,.ts}')],
    migrationsTableName: 'typeorm_migrations',
    password: process.env.DB_PASSWORD ?? 'nestjs',
    port: parsePort(process.env.DB_PORT, 5432),
    synchronize: false,
    type: 'postgres',
    username: process.env.DB_USERNAME ?? 'nestjs',
  };
}

export function getDatabaseConfig(): TypeOrmModuleOptions {
  const databaseOptions = {
    ...getDatabaseOptions(),
    retryAttempts: 3,
    retryDelay: 1000,
  };

  return databaseOptions;
}
