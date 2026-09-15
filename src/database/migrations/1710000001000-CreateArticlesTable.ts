import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const ARTICLES_TABLE_NAME = 'articles';
const ARTICLES_SLUG_INDEX_NAME = 'IDX_articles_slug_unique';
const USERS_TABLE_NAME = 'users';

export class CreateArticlesTable1710000001000 implements MigrationInterface {
  name = 'CreateArticlesTable1710000001000';

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
            length: '255',
            name: 'slug',
            type: 'varchar',
          },
          {
            isNullable: false,
            length: '200',
            name: 'title',
            type: 'varchar',
          },
          {
            isNullable: false,
            length: '500',
            name: 'description',
            type: 'varchar',
          },
          {
            isNullable: false,
            name: 'body',
            type: 'text',
          },
          {
            default: "'{}'",
            isArray: true,
            isNullable: false,
            name: 'tag_list',
            type: 'text',
          },
          {
            default: 0,
            isNullable: false,
            name: 'favorites_count',
            type: 'integer',
          },
          {
            isNullable: false,
            name: 'author_id',
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
        ],
        name: ARTICLES_TABLE_NAME,
      }),
    );

    await queryRunner.createIndex(
      ARTICLES_TABLE_NAME,
      new TableIndex({
        columnNames: ['slug'],
        isUnique: true,
        name: ARTICLES_SLUG_INDEX_NAME,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(ARTICLES_TABLE_NAME, true);
  }
}
