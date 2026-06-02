import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  service: string;
  uptime: number;
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: '@rootmatching/api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
