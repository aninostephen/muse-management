import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { RefreshableDateRangeQueryDto } from '../../infloww/dto/infloww-query.dto';

export class DashboardRevenueQueryDto extends RefreshableDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Aggregation granularity for the revenue chart',
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  granularity?: 'daily' | 'weekly' | 'monthly' = 'daily';
}
