import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

const ARTICLES_TABLE_NAME = 'articles';
const AUTHOR_ID_INDEX_NAME = 'IDX_articles_author_id';
const CREATED_AT_INDEX_NAME = 'IDX_articles_created_at_id';
const TAG_LIST_INDEX_NAME = 'IDX_articles_tag_list_gin';

export class AddArticleListIndexes1710000001500 implements MigrationInterface {
  name = 'AddArticleListIndexes1710000001500';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      ARTICLES_TABLE_NAME,
      new TableIndex({
        columnNames: ['created_at', 'id'],
        name: CREATED_AT_INDEX_NAME,
      }),
    );
    await queryRunner.createIndex(
      ARTICLES_TABLE_NAME,
      new TableIndex({
        columnNames: ['author_id'],
        name: AUTHOR_ID_INDEX_NAME,
      }),
    );
    await queryRunner.query(
      `CREATE INDEX "${TAG_LIST_INDEX_NAME}" ON "${ARTICLES_TABLE_NAME}" USING GIN ("tag_list")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "${TAG_LIST_INDEX_NAME}"`);
    await queryRunner.dropIndex(ARTICLES_TABLE_NAME, AUTHOR_ID_INDEX_NAME);
    await queryRunner.dropIndex(ARTICLES_TABLE_NAME, CREATED_AT_INDEX_NAME);
  }
}
