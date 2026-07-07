import { Expose } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CleanupExpiredHoldsDto {
  @Expose()
  @IsInt()
  deletedCount!: number;
}
