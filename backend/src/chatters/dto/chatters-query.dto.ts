import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RefreshableDateRangeQueryDto } from '../../infloww/dto/infloww-query.dto';

export class ChattersQueryDto extends RefreshableDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Search by chatter/employee name or ID',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by employee status',
    enum: ['all', 'Activated', 'Deactivated', 'Deleted'],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Field to sort chatters by',
    enum: [
      'name',
      'totalSales',
      'ppvSales',
      'tipsSales',
      'directMessagesSent',
      'ppvsUnlocked',
      'unlockRate',
    ],
    default: 'totalSales',
  })
  @IsOptional()
  @IsIn([
    'name',
    'totalSales',
    'ppvSales',
    'tipsSales',
    'directMessagesSent',
    'ppvsUnlocked',
    'unlockRate',
  ])
  sortBy?:
    | 'name'
    | 'totalSales'
    | 'ppvSales'
    | 'tipsSales'
    | 'directMessagesSent'
    | 'ppvsUnlocked'
    | 'unlockRate';

  @ApiPropertyOptional({
    description: 'Sort order',
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
