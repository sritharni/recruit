import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Profile } from './profile.entity';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [TypeOrmModule.forFeature([Profile]), EmbeddingModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}