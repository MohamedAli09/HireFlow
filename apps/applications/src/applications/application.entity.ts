import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  INTERVIEW = 'interview',
  OFFERED = 'offered',
  REJECTED = 'rejected', // business decision — notify candidate
  CANCELLED = 'cancelled', // technical failure — do NOT notify candidate
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  // We store IDs as references — we never JOIN to Jobs or Auth databases.
  // If we need a job's title in a notification, we store it here at apply-time.
  @Column()
  jobId!: number;

  @Column()
  candidateId!: number;

  @Column()
  recruiterId!: number; // stored here so Notifications knows who to email

  @Column()
  jobTitle!: string; // denormalized from Jobs Service at apply-time

  @Column()
  candidateEmail!: string; // denormalized from Auth token at apply-time

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status!: ApplicationStatus;

  @CreateDateColumn()
  appliedAt!: Date;
}
