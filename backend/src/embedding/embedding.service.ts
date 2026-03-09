import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

@Injectable()
export class EmbeddingService {
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!text || !text.trim()) {
      return new Array(EMBEDDING_DIM).fill(0);
    }
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
    });
    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== EMBEDDING_DIM) {
      throw new Error('Invalid embedding response');
    }
    return embedding;
  }
}
