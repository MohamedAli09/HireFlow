export class ScheduleInterviewCommand {
  constructor(
    public readonly applicationId: number,
    public readonly candidateId: number,
    public readonly candidateEmail: string,
    public readonly jobTitle: string,
    public readonly scheduledAt: Date,
    public readonly recruiterId: number,
    public readonly meetingLink?: string,
  ) {}
}
