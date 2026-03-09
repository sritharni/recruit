import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pgvector from 'pgvector';
import { Profile } from './profile.entity';
import { FilterDto } from './filter.dto';
import { EmbeddingService } from '../embedding/embedding.service';

export interface ProfileResponse {
  id: number;
  name: string;
  skills: string[];
  experience: number;
  location: string;
  gender: string;
  linkedinUrl: string;
}

function toResponse(p: Profile): ProfileResponse {
  const skills =
    typeof p.skills === 'string'
      ? p.skills ? p.skills.split(',').map((s) => s.trim()) : []
      : Array.isArray(p.skills)
        ? p.skills
        : [];
  return {
    id: p.id,
    name: p.name,
    skills,
    experience: p.experience,
    location: p.location,
    gender: p.gender,
    linkedinUrl: p.linkedinUrl,
  };
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    private embeddingService: EmbeddingService,
    private config: ConfigService,
  ) {}

  async backfillEmbeddings(): Promise<void> {
    const qr = this.profileRepo.manager.connection.createQueryRunner();
    await qr.connect();
    try {
      const rows = await qr.query(
        'SELECT id, skills FROM profiles WHERE skills_embedding IS NULL AND skills IS NOT NULL AND skills != \'\'',
      );
      const needBackfill = Array.isArray(rows) ? rows.length : 0;
      if (needBackfill > 0) {
        console.log(`[TIMING] backfillEmbeddings start (${needBackfill} profiles)`);
      }
      for (let i = 0; i < (Array.isArray(rows) ? rows.length : 0); i++) {
        const row = (rows as { id: number; skills: string }[])[i];
        const tRow = Date.now();
        try {
          const embedding = await this.embeddingService.embedText(row.skills);
          const vectorSql = pgvector.toSql(embedding);
          await qr.query(
            'UPDATE profiles SET skills_embedding = $1::vector WHERE id = $2',
            [vectorSql, row.id],
          );
          console.log(`[TIMING] backfillEmbeddings profile id=${row.id} +${Date.now() - tRow}ms`);
        } catch {
          // Skip on embedding failure (e.g. no API key)
        }
      }
    } finally {
      await qr.release();
    }
  }

  async updateSkillsEmbedding(profileId: number, skills: string): Promise<void> {
    const embedding = await this.embeddingService.embedText(skills);
    const vectorSql = pgvector.toSql(embedding);
    await this.profileRepo.manager.query(
      'UPDATE profiles SET skills_embedding = $1::vector WHERE id = $2',
      [vectorSql, profileId],
    );
  }

  async getProfiles(filter: FilterDto): Promise<{ data: ProfileResponse[]; total: number }> {
    const t0 = Date.now();
    const hasSkillsFilter = (filter.skills?.trim() ?? '').length > 0;
    const useSimilaritySearch = hasSkillsFilter;

    if (useSimilaritySearch) {
      const out = await this.getProfilesBySimilarity(filter);
      console.log(`[TIMING] getProfiles (similarity) +${Date.now() - t0}ms`);
      return out;
    }

    const out = await this.getProfilesByFilters(filter);
    console.log(`[TIMING] getProfiles (filters) +${Date.now() - t0}ms`);
    return out;
  }

  private async getProfilesBySimilarity(filter: FilterDto): Promise<{ data: ProfileResponse[]; total: number }> {
    const t0 = Date.now();
    let queryVector: number[];
    try {
      queryVector = await this.embeddingService.embedText(filter.skills!.trim());
      console.log(`[TIMING] getProfilesBySimilarity embed +${Date.now() - t0}ms`);
    } catch {
      return this.getProfilesByFilters(filter);
    }

    const result = await this.runSimilarityQuery(filter, queryVector);
    if (result.total === 0) {
      return this.getProfilesByFilters(filter);
    }
    return result;
  }

  private async runSimilarityQuery(
    filter: FilterDto,
    queryVector: number[],
  ): Promise<{ data: ProfileResponse[]; total: number }> {
    const vectorSql = pgvector.toSql(queryVector);
    const page = filter.page || 1;
    const limit = filter.limit || 5;
    const offset = (page - 1) * limit;

    const threshold =
      parseFloat(this.config.get<string>('SKILLS_SIMILARITY_THRESHOLD') ?? '0.7') || 0.7;

    const qr = this.profileRepo.manager.connection.createQueryRunner();
    await qr.connect();

    try {
      const conditions: string[] = [
        'skills_embedding IS NOT NULL',
        `(skills_embedding <=> $1) < $2`,
      ];
      const params: unknown[] = [vectorSql, threshold];
      let paramIdx = 3;

      if (filter.experience != null && filter.experience > 0) {
        conditions.push(`experience >= $${paramIdx}`);
        params.push(filter.experience);
        paramIdx++;
      }
      if (filter.location) {
        conditions.push(`LOWER(location) LIKE $${paramIdx}`);
        params.push(`%${filter.location.toLowerCase()}%`);
        paramIdx++;
      }
      if (filter.gender) {
        conditions.push(`LOWER(gender) = $${paramIdx}`);
        params.push(filter.gender.toLowerCase());
        paramIdx++;
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const countParams = params.slice(0, paramIdx);

      const countResult = await qr.query(
        `SELECT COUNT(*)::int as count FROM profiles ${whereClause}`,
        countParams,
      );
      const total = countResult[0]?.count ?? 0;

      params.push(limit, offset);
      const rows = await qr.query(
        `SELECT id, name, skills, experience, location, gender, "linkedinUrl" FROM profiles ${whereClause}
         ORDER BY skills_embedding <=> $1
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        params,
      );

      const profiles = rows.map((r: Record<string, unknown>) => {
        const p = new Profile();
        p.id = r.id as number;
        p.name = r.name as string;
        p.skills = r.skills as string;
        p.experience = r.experience as number;
        p.location = (r.location as string) ?? '';
        p.gender = (r.gender as string) ?? '';
        p.linkedinUrl = (r.linkedinUrl as string) ?? '';
        return p;
      });
      return { data: profiles.map(toResponse), total };
    } finally {
      await qr.release();
    }
  }

  private async getProfilesByFilters(
    filter: FilterDto,
  ): Promise<{ data: ProfileResponse[]; total: number }> {
    const qb = this.profileRepo.createQueryBuilder('profile');

    if (filter.skills) {
      const requiredSkills = filter.skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (requiredSkills.length > 0) {
        qb.andWhere(
          requiredSkills.map((_, i) => `LOWER(profile.skills) LIKE :skill${i}`).join(' OR '),
          Object.fromEntries(requiredSkills.map((s, i) => [`skill${i}`, `%${s}%`])),
        );
      }
    }
    if (filter.experience != null && filter.experience > 0) {
      qb.andWhere('profile.experience >= :exp', { exp: filter.experience });
    }
    if (filter.location) {
      qb.andWhere('LOWER(profile.location) LIKE :loc', { loc: `%${filter.location.toLowerCase()}%` });
    }
    if (filter.gender) {
      qb.andWhere('LOWER(profile.gender) = :gender', { gender: filter.gender.toLowerCase() });
    }

    const total = await qb.getCount();

    const page = filter.page || 1;
    const limit = filter.limit || 5;
    const start = (page - 1) * limit;
    qb.skip(start).take(limit);

    const profiles = await qb.getMany();
    return { data: profiles.map(toResponse), total };
  }
}
