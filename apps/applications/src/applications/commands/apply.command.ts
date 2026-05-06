export class ApplyCommand {
  constructor(
    public readonly jobId: number,
    public readonly candidateId: number,
    public readonly candidateEmail: string,
  ) {}
}
