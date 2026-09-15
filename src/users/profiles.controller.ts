import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { noCacheHeaders } from '../common/decorators/no-cache-headers.decorator';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UsersService } from './users.service';

@Controller('api/profiles')
@ApiTags('Profiles')
export class ProfilesController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  @noCacheHeaders()
  @ApiOperation({ summary: 'Get a public user profile' })
  @ApiParam({
    description: 'Public username',
    example: 'jake',
    name: 'username',
  })
  @ApiOkResponse({ description: 'Public profile', type: ProfileResponseDto })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  async getProfile(@Param('username') username: string) {
    const profile =
      await this.usersService.findPublicProfileByUsername(username);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return { profile };
  }
}
