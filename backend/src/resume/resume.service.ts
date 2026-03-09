import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pgvector from 'pgvector';
import { Resume } from './resume.entity';
import { Profile } from '../profiles/profile.entity';
import { ResumeParserService, ParsedProfile } from '../resume-parser/resume-parser.service';
import { EmbeddingService } from '../embedding/embedding.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(Resume) private resumeRepo: Repository<Resume>,
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    private parser: ResumeParserService,
    private embeddingService: EmbeddingService,
    private config: ConfigService,
  ) {}

  async uploadResume(
    file: Express.Multer.File,
  ): Promise<{
    id: number;
    name: string;
    skills: string[];
    experience: number;
    location: string;
    gender: string;
    linkedinUrl: string;
  }> {
    const t0 = Date.now();
    console.log('[TIMING] uploadResume start');
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large (max 5MB)');
    }

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOCX files are allowed');
    }

    let parsed: ParsedProfile;
    const ext = file.originalname.toLowerCase().split('.').pop();

    if (ext === 'pdf') {
      parsed = await this.parser.parsePdf(file.buffer);
    } else if (ext === 'docx') {
      parsed = await this.parser.parseDocx(file.buffer);
    } else {
      throw new BadRequestException('Only PDF and DOCX files are allowed');
    }
    console.log(`[TIMING] uploadResume parse done +${Date.now() - t0}ms`);

    const tTx = Date.now();
    const result = await this.profileRepo.manager.transaction(async (tx) => {
      const profileRepo = tx.getRepository(Profile);
      const resumeRepo = tx.getRepository(Resume);

      const profile = profileRepo.create({
        name: parsed.name,
        skills: parsed.skills.join(','),
        experience: parsed.experience,
        location: parsed.location,
        gender: parsed.gender,
        linkedinUrl: parsed.linkedinUrl || '',
        email: parsed.email || null,
        resumeUrl: null,
      });

      const savedProfile = await profileRepo.save(profile);

      const resume = resumeRepo.create({
        originalFilename: file.originalname,
        storedPath: null,
        profileId: savedProfile.id,
      });

      await resumeRepo.save(resume);

      const skills =
        typeof savedProfile.skills === 'string'
          ? savedProfile.skills
            ? savedProfile.skills.split(',')
            : []
          : Array.isArray(savedProfile.skills)
            ? savedProfile.skills
            : [];

      return {
        id: savedProfile.id,
        name: savedProfile.name,
        skills,
        experience: savedProfile.experience,
        location: savedProfile.location,
        gender: savedProfile.gender,
        linkedinUrl: savedProfile.linkedinUrl,
      };
    });
    console.log(`[TIMING] uploadResume transaction done +${Date.now() - tTx}ms`);

    const tEmb = Date.now();
    try {
      const embedding = await this.embeddingService.embedText(parsed.skills.join(','));
      const vectorSql = pgvector.toSql(embedding);

      await this.profileRepo.manager.query(
        'UPDATE profiles SET skills_embedding = $1::vector WHERE id = $2',
        [vectorSql, result.id],
      );
      console.log(`[TIMING] uploadResume embedding +${Date.now() - tEmb}ms`);
    } catch {
      // Skip embedding on failure
    }

    console.log(`[TIMING] uploadResume done +${Date.now() - t0}ms`);
    return result;
  }
}