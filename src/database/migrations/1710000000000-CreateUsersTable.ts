import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const USERS_TABLE_NAME = 'users';
const EMAIL_INDEX_NAME = 'IDX_users_email_unique';
const USERNAME_INDEX_NAME = 'IDX_users_username_unique';
const CREATE_UUID_EXTENSION_QUERY =
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"';

export class CreateUsersTable1710000000000 implements MigrationInterface {
  name = 'CreateUsersTable1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(CREATE_UUID_EXTENSION_QUERY);

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
            length: '254',
            name: 'email',
            type: 'varchar',
          },
          {
            isNullable: false,
            length: '30',
            name: 'username',
            type: 'varchar',
          },
          {
            isNullable: false,
            length: '100',
            name: 'password_hash',
            type: 'varchar',
          },
          {
            isNullable: true,
            name: 'bio',
            type: 'text',
          },
          {
            isNullable: true,
            length: '2048',
            name: 'image',
            type: 'varchar',
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
        name: USERS_TABLE_NAME,
      }),
    );

    await queryRunner.createIndex(
      USERS_TABLE_NAME,
      new TableIndex({
        columnNames: ['email'],
        isUnique: true,
        name: EMAIL_INDEX_NAME,
      }),
    );

    await queryRunner.createIndex(
      USERS_TABLE_NAME,
      new TableIndex({
        columnNames: ['username'],
        isUnique: true,
        name: USERNAME_INDEX_NAME,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(USERS_TABLE_NAME, true);
  }
}
