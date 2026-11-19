import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RefreshableDateRangeQueryDto } from '../../infloww/dto/infloww-query.dto';

export class CreatorsQueryDto extends RefreshableDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Search by creator name, nickname, username, or tag',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator connection status',
    example: 'connected',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Field to sort creators by',
    enum: [
      'name',
      'totalEarningsGross',
      'totalEarningsNet',
      'subscriptionRevenue',
      'activeFans',
      'transactionCount',
    ],
    default: 'totalEarningsGross',
  })
  @IsOptional()
  @IsIn([
    'name',
    'totalEarningsGross',
    'totalEarningsNet',
    'subscriptionRevenue',
    'activeFans',
    'transactionCount',
  ])
  sortBy?:
    | 'name'
    | 'totalEarningsGross'
    | 'totalEarningsNet'
    | 'subscriptionRevenue'
    | 'activeFans'
    | 'transactionCount';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (defaults to 10)',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
