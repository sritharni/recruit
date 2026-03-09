import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalFilename: string;

  @Column({ type: 'varchar', nullable: true })
  storedPath: string | null;

  @Column()
  profileId: number;

  @CreateDateColumn()
  uploadedAt: Date;
}
