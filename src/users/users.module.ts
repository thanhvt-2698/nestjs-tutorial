import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [Logger, UsersService],
})
export class UsersModule {}
