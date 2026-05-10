import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn()
  id!: number;

  // Soft references — no foreign keys across service boundaries
  @Column()
  applicationId!: number;

  @Column()
  candidateId!: number;

  @Column()
  recruiterId!: number;

  // Denormalized at schedule-time — same reason as jobTitle in Applications
  @Column()
  candidateEmail!: string;

  @Column()
  jobTitle!: string;

  @Column()
  scheduledAt!: Date;

  @Column({ nullable: true })
  meetingLink!: string;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status!: InterviewStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
