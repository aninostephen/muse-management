import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EarningsQueryDto } from './dto/earnings-query.dto';
import { EarningsService } from './earnings.service';

@ApiTags('Earnings')
@ApiBearerAuth()
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) { }

  @Get()
  @ApiOperation({
    summary:
      'Get agency or creator earnings breakdown, time-series revenue, category distribution, and refunds',
  })
  async getEarnings(@Query() query: EarningsQueryDto) {
    return this.earningsService.getEarningsAnalytics(query);
  }
}
