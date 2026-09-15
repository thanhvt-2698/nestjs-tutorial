import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getJwtModuleOptions } from '../config/jwt.config';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register(getJwtModuleOptions()),
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
