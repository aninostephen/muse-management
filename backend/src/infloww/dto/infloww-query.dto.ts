import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional } from 'class-validator';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';

export class RefreshableDateRangeQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Set to "true" to bypass backend cache and force a fresh fetch from Infloww',
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  refresh?: string;
}
