import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { PASSWORD_SALT_ROUNDS } from '../auth/constants/auth.constants';
import { DatabaseOperationError } from './database-operation.error';
import {
  DEFAULT_PROFILE_FOLLOWING_STATUS,
  POSTGRES_UNIQUE_VIOLATION_CODE,
} from './constants/users.constants';
import { PublicProfile } from './interfaces/profile.interface';
import { UserEntity } from './entities/user.entity';
import {
  AuthenticatedUser,
  UserRecord,
  UserResponse,
} from './interfaces/user.interface';
import { CreateUserInput } from './interfaces/create-user-input.interface';
import { UpdateUserInput } from './interfaces/update-user-input.interface';

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

  async findById(id: string): Promise<AuthenticatedUser | undefined> {
    return (
      (await this.usersRepository.findOne({
        select: {
          bio: true,
          email: true,
          id: true,
          image: true,
          username: true,
        },
        where: { id },
      })) ?? undefined
    );
  }

  async findByUsername(
    username: string,
  ): Promise<Pick<UserRecord, 'id'> | undefined> {
    const normalizedUsername = this.normalizeUsername(username);

    return (
      (await this.usersRepository.findOne({
        select: { id: true },
        where: { username: normalizedUsername },
      })) ?? undefined
    );
  }

  async getPublicProfileByUsername(username: string): Promise<PublicProfile> {
    const normalizedUsername = this.normalizeUsername(username);
    const user = await this.usersRepository.findOne({
      select: {
        bio: true,
        image: true,
        username: true,
      },
      where: { username: normalizedUsername },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return {
      bio: user.bio,
      following: DEFAULT_PROFILE_FOLLOWING_STATUS,
      image: user.image,
      username: user.username,
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException(
        'At least one user field must be provided for update',
      );
    }

    const user = await this.usersRepository.findOne({
      select: {
        bio: true,
        email: true,
        id: true,
        image: true,
        passwordHash: true,
        username: true,
      },
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (input.username !== undefined) {
      const username = this.normalizeUsername(input.username);

      if (username !== user.username) {
        const existingUser = await this.findByUsername(username);

        if (existingUser && existingUser.id !== id) {
          throw new ConflictException('Username is already in use');
        }

        user.username = username;
      }
    }

    if (input.password !== undefined) {
      user.passwordHash = await bcrypt.hash(
        input.password,
        PASSWORD_SALT_ROUNDS,
      );
    }

    if (input.bio !== undefined) {
      user.bio = input.bio;
    }

    if (input.image !== undefined) {
      user.image = input.image;
    }

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        this.logger.warn({
          message: 'Rejected duplicate user update',
          operation: 'UsersService.update',
          userId: id,
        });
        throw new ConflictException({
          error: 'UserConflict',
          guidance: 'Use a unique email and username',
          message: 'Email or username is already in use',
        });
      }

      this.logger.error({
        error: this.getErrorDetails(error),
        message: 'Failed to update user',
        operation: 'UsersService.update',
        userId: id,
      });

      throw new DatabaseOperationError('Unable to update user', {
        cause: error,
      });
    }
  }

  toAuthenticatedUser(user: AuthenticatedUser | UserRecord): AuthenticatedUser {
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
