import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT_ROUNDS } from './constants/auth.constants';
import { getJwtExpiresIn } from '../config/jwt.config';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  AuthenticatedUser,
  UserRecord,
  UserResponse,
} from '../users/interfaces/user.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(userDto: RegisterUserDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(
      userDto.password,
      PASSWORD_SALT_ROUNDS,
    );
    const user = await this.usersService.create({
      email: userDto.email,
      passwordHash,
      username: userDto.username,
    });

    return this.createAuthResponse(user);
  }

  async login(userDto: LoginUserDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(userDto.email);

    if (!user || !(await bcrypt.compare(userDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  async validateJwtPayload(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.usersService.toAuthenticatedUser(user);
  }

  toResponse(user: AuthenticatedUser): UserResponse {
    return this.usersService.toResponse(user);
  }

  createAuthResponse(user: UserRecord): AuthResponse {
    const token = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
      },
      {
        expiresIn: getJwtExpiresIn(),
      },
    );

    return {
      user: {
        ...this.usersService.toResponse(user),
        token,
      },
    };
  }
}
