import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  AuthenticatedUser,
  UserRecord,
  UserResponse,
} from './interfaces/user.interface';
import { UserEntity } from './entities/user.entity';
import { DatabaseOperationError } from './database-operation.error';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly logger: Logger,
  ) {}

  async create(input: CreateUserInput): Promise<UserRecord> {
    const email = this.normalizeEmail(input.email);
    const username = this.normalizeUsername(input.username);

    if (await this.findByEmail(email)) {
      throw new ConflictException('Email is already in use');
    }

    if (await this.findByUsername(username)) {
      throw new ConflictException('Username is already in use');
    }

    const user = this.usersRepository.create({
      bio: null,
      email,
      image: null,
      passwordHash: input.passwordHash,
      username,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        this.logger.warn({
          message: 'Rejected duplicate user',
          operation: 'UsersService.create',
          username,
        });
        throw new ConflictException({
          error: 'UserConflict',
          guidance: 'Use a unique email and username',
          message: 'Email or username is already in use',
        });
      }

      this.logger.error({
        error: this.getErrorDetails(error),
        message: 'Failed to persist user',
        operation: 'UsersService.create',
        username,
      });

      throw new DatabaseOperationError('Unable to create user', {
        cause: error,
      });
    }
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const normalizedEmail = this.normalizeEmail(email);

    return (
      (await this.usersRepository.findOne({
        where: { email: normalizedEmail },
      })) ?? undefined
    );
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    return (await this.usersRepository.findOne({ where: { id } })) ?? undefined;
  }

  async findByUsername(username: string): Promise<UserRecord | undefined> {
    const normalizedUsername = this.normalizeUsername(username);

    return (
      (await this.usersRepository.findOne({
        where: { username: normalizedUsername },
      })) ?? undefined
    );
  }

  toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
    return {
      bio: user.bio,
      email: user.email,
      id: user.id,
      image: user.image,
      username: user.username,
    };
  }

  toResponse(user: AuthenticatedUser | UserRecord): UserResponse {
    return {
      bio: user.bio,
      email: user.email,
      image: user.image,
      username: user.username,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };

    return driverError.code === POSTGRES_UNIQUE_VIOLATION_CODE;
  }

  private getErrorDetails(error: unknown): Record<string, string> {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack ?? '',
      };
    }

    return { message: String(error) };
  }
}
