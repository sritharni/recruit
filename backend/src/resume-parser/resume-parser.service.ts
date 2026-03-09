import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ParsedProfile {
  name: string;
  skills: string[];
  experience: number;
  location: string;
  gender: string;
  linkedinUrl: string;
  email?: string;
}

const PROFILE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
    experience: { type: 'number' },
    location: { type: 'string' },
    gender: { type: 'string' },
    linkedinUrl: { type: 'string' },
    email: { type: 'string' },
  },
  required: ['name', 'skills', 'experience', 'location', 'gender', 'linkedinUrl', 'email'],
  additionalProperties: false,
};

@Injectable()
export class ResumeParserService {
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async parsePdf(buffer: Buffer): Promise<ParsedProfile> {
    const t0 = Date.now();
    console.log('[TIMING] parsePdf start');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    console.log(`[TIMING] parsePdf text extraction +${Date.now() - t0}ms`);
    return this.extractWithLLM(result.text || '');
  }

  async parseDocx(buffer: Buffer): Promise<ParsedProfile> {
    const t0 = Date.now();
    console.log('[TIMING] parseDocx start');
    const result = await mammoth.extractRawText({ buffer });
    console.log(`[TIMING] parseDocx text extraction +${Date.now() - t0}ms`);
    return this.extractWithLLM(result.value || '');
  }

  async extractWithLLM(text: string): Promise<ParsedProfile> {
    const t0 = Date.now();
    console.log('[TIMING] extractWithLLM (OpenAI) start');
    if (!this.openai) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const systemPrompt = `You are a resume parser. Extract candidate information from the resume text and return ONLY valid JSON matching this schema:
{
  "name": "string - full name",
  "skills": ["array of technical/professional skills"],
  "experience": number - total years of experience (0 if unknown),
  "location": "string - city/region/country",
  "gender": "string - Male/Female/Unknown (only if clearly stated)",
  "linkedinUrl": "string - LinkedIn URL or empty string",
  "email": "string - email or empty string"
}
Use "" for missing strings, 0 for unknown experience, "Unknown" for gender if not stated. Return ONLY the JSON object, no markdown or extra text.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'profile',
          strict: true,
          schema: PROFILE_JSON_SCHEMA,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    console.log(`[TIMING] extractWithLLM (OpenAI) done +${Date.now() - t0}ms`);
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content) as ParsedProfile;
    return {
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: typeof parsed.experience === 'number' ? parsed.experience : 0,
      linkedinUrl: parsed.linkedinUrl || '',
      location: parsed.location || '',
      gender: parsed.gender || 'Unknown',
      email: parsed.email || '',
    };
  }
}
