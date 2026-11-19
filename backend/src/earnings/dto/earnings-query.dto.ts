import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RefreshableDateRangeQueryDto } from '../../infloww/dto/infloww-query.dto';

export class EarningsQueryDto extends RefreshableDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter earnings by a specific Infloww Creator ID',
  })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({
    description: 'Time-series aggregation granularity',
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  granularity?: 'daily' | 'weekly' | 'monthly' = 'daily';

  @ApiPropertyOptional({
    description: 'Page number for recent transactions table (1-indexed)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page for recent transactions table (defaults to 10)',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
