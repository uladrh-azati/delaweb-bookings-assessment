import { Controller, Get } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsIn } from 'class-validator';

class HealthDto {
  @Expose()
  @IsIn(['ok'])
  status!: 'ok';
}

@Controller('health')
export class HealthController {
  @Get()
  health(): HealthDto {
    return { status: 'ok' };
  }
}
