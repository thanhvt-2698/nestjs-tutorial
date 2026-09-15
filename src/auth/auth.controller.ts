import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
}
