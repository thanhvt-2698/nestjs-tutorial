import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  AuthResponseDto,
  CurrentUserResponseDto,
} from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { noCacheHeaders } from '../common/decorators/no-cache-headers.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedUser } from './interfaces/user.interface';
import { UsersService } from './users.service';

@Controller('api')
@ApiTags('Users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({
    description: 'Send Authorization as `Bearer <jwt>` or `Token <jwt>`.',
    summary: 'Get the authenticated user',
  })
  @ApiOkResponse({ description: 'Current user', type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return { user: this.usersService.toResponse(user) };
  }

  @Put('user')
  @UseGuards(JwtAuthGuard)
  @noCacheHeaders()
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update the authenticated user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Username is already in use' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async updateCurrentUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: UpdateUserDto,
  ) {
    return this.authService.updateCurrentUser(currentUser.id, body.user);
  }
}
