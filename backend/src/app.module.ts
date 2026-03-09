import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { ResumeModule } from './resume/resume.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { Profile } from './profiles/profile.entity';
import { Resume } from './resume/resume.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmbeddingModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? '',
      database: process.env.POSTGRES_DATABASE || 'recruit',
      entities: [Profile, Resume],
      synchronize: true,
      ssl: process.env.POSTGRES_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
    }),
    ProfilesModule,
    ResumeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
