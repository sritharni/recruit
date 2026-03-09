import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resume } from './resume.entity';
import { Profile } from '../profiles/profile.entity';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeParserModule } from '../resume-parser/resume-parser.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume, Profile]),
    ResumeParserModule,
    EmbeddingModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
