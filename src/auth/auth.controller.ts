import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthResponseDto,
  CurrentUserResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../users/interfaces/user.interface';
import { noCacheHeaders } from '../common/decorators/no-cache-headers.decorator';

@Controller('api')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  @noCacheHeaders()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Email or username is already in use' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.user);
  }

  @Post('users/login')
  @HttpCode(HttpStatus.OK)
  @noCacheHeaders()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successful', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.user);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({
    description: 'Send Authorization as Bearer <jwt> or Token <jwt>.',
    summary: 'Get the authenticated user',
  })
  @ApiOkResponse({ description: 'Current user', type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return { user: this.authService.toResponse(user) };
  }
}
