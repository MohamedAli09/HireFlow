// apps/jobs/src/jobs/job.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('jobs') 
export class Job {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  location!: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salaryMin!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salaryMax!: number;

  // We store the recruiter's ID from Auth Service — but we don't JOIN to Auth's DB.
  // We only keep the ID as a reference. The name lives in Auth Service.
  @Column()
  recruiterId!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}