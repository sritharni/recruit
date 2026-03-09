import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('simple-array')
  skills: string;

  @Column('int', { default: 0 })
  experience: number;

  @Column({ default: '' })
  location: string;

  @Column({ default: '' })
  gender: string;

  @Column({ default: '' })
  linkedinUrl: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  resumeUrl: string | null;

  @Column({ type: 'text', nullable: true })
  rawText: string | null;

  @Column({ type: 'vector', length: 1536, nullable: true })
  skills_embedding?: number[] | null;

  @CreateDateColumn()
  createdAt: Date;
}
