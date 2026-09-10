import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_users_email_unique', { unique: true })
  @Column({ length: 254, type: 'varchar' })
  email!: string;

  @Index('IDX_users_username_unique', { unique: true })
  @Column({ length: 30, type: 'varchar' })
  username!: string;

  @Column({ length: 100, name: 'password_hash', type: 'varchar' })
  passwordHash!: string;

  @Column({ nullable: true, type: 'text' })
  bio!: string | null;

  @Column({ length: 2048, nullable: true, type: 'varchar' })
  image!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
