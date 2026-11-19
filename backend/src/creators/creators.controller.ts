import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RefreshableDateRangeQueryDto } from '../infloww/dto/infloww-query.dto';
import { CreatorsService } from './creators.service';
import { CreatorsQueryDto } from './dto/creators-query.dto';

@ApiTags('Creators')
@ApiBearerAuth()
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get()
  @ApiOperation({
    summary: 'List creators with aggregated revenue and fan statistics',
  })
  async getCreators(@Query() query: CreatorsQueryDto) {
    return this.creatorsService.getCreatorsList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get detailed statistics, daily revenue, and fan analytics for a single creator',
  })
  @ApiParam({ name: 'id', description: 'Infloww Creator ID' })
  async getCreatorById(
    @Param('id') id: string,
    @Query() query: RefreshableDateRangeQueryDto,
  ) {
    return this.creatorsService.getCreatorById(
      id,
      query.startDate,
      query.endDate,
      query.refresh,
    );
  }
}
