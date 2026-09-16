import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const ARTICLES_TABLE_NAME = 'articles';
const COMMENTS_TABLE_NAME = 'comments';
const COMMENTS_ARTICLE_CREATED_INDEX_NAME = 'IDX_comments_article_created';
const USERS_TABLE_NAME = 'users';

export class CreateCommentsTable1710000002000 implements MigrationInterface {
  name = 'CreateCommentsTable1710000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        columns: [
          {
            default: 'uuid_generate_v4()',
            isPrimary: true,
            name: 'id',
            type: 'uuid',
          },
          {
            isNullable: false,
            name: 'body',
            type: 'text',
          },
          {
            isNullable: false,
            name: 'author_id',
            type: 'uuid',
          },
          {
            isNullable: false,
            name: 'article_id',
            type: 'uuid',
          },
          {
            default: 'now()',
            isNullable: false,
            name: 'created_at',
            type: 'timestamptz',
          },
          {
            default: 'now()',
            isNullable: false,
            name: 'updated_at',
            type: 'timestamptz',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['author_id'],
            onDelete: 'CASCADE',
            referencedColumnNames: ['id'],
            referencedTableName: USERS_TABLE_NAME,
          }),
          new TableForeignKey({
            columnNames: ['article_id'],
            onDelete: 'CASCADE',
            referencedColumnNames: ['id'],
            referencedTableName: ARTICLES_TABLE_NAME,
          }),
        ],
        name: COMMENTS_TABLE_NAME,
      }),
    );

    await queryRunner.createIndex(
      COMMENTS_TABLE_NAME,
      new TableIndex({
        columnNames: ['article_id', 'created_at'],
        name: COMMENTS_ARTICLE_CREATED_INDEX_NAME,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(COMMENTS_TABLE_NAME, true);
  }
}
