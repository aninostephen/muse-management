import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { RefreshableDateRangeQueryDto } from '../../infloww/dto/infloww-query.dto';
import { InflowwLinkStatus, InflowwLinkType } from '../../infloww/infloww.types';

export class TrackingLinksQueryDto extends RefreshableDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by Infloww Creator ID',
  })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by marketing link type',
    enum: ['ALL', 'TRACKING', 'TRIAL', 'CAMPAIGN'],
    default: 'ALL',
  })
  @IsOptional()
  @IsIn(['ALL', 'TRACKING', 'TRIAL', 'CAMPAIGN'])
  linkType?: 'ALL' | InflowwLinkType = 'ALL';

  @ApiPropertyOptional({
    description: 'Filter by link status (applicable to TRACKING and TRIAL links)',
    enum: ['ACTIVE', 'DEACTIVATED'],
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'DEACTIVATED'])
  status?: InflowwLinkStatus;

  @ApiPropertyOptional({
    description: 'Search by link name, campaign message, code, source, or creator name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'grossRevenue',
      'netRevenue',
      'subscribers',
      'clicks',
      'conversionRate',
      'createdTime',
    ],
    default: 'grossRevenue',
  })
  @IsOptional()
  @IsIn([
    'grossRevenue',
    'netRevenue',
    'subscribers',
    'clicks',
    'conversionRate',
    'createdTime',
  ])
  sortBy?:
    | 'grossRevenue'
    | 'netRevenue'
    | 'subscribers'
    | 'clicks'
    | 'conversionRate'
    | 'createdTime' = 'grossRevenue';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

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

export class LinkFansQueryDto {
  @ApiProperty({ description: 'Infloww Creator ID' })
  @IsNotEmpty()
  @IsString()
  creatorId!: string;

  @ApiProperty({
    description: 'Marketing link type',
    enum: ['TRACKING', 'TRIAL', 'CAMPAIGN'],
  })
  @IsNotEmpty()
  @IsIn(['TRACKING', 'TRIAL', 'CAMPAIGN'])
  linkType!: InflowwLinkType;

  @ApiProperty({ description: 'Link ID' })
  @IsNotEmpty()
  @IsString()
  linkId!: string;

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
