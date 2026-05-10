import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface Job {
  id: number;
  title: string;
  recruiterId: number;
  isActive: boolean;
}

@Injectable()
export class JobsClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getJob(jobId: number): Promise<Job> {
    try {
      const jobsUrl = this.config.get<string>('JOBS_SERVICE_URL');
      const response = (await firstValueFrom(
        this.httpService.get<Job>(`${jobsUrl}/jobs/${jobId}`),
      )) as { data: Job };
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 404) {
        throw new NotFoundException(`Job #${jobId} not found`);
      }
      throw error;
    }
  }
}
