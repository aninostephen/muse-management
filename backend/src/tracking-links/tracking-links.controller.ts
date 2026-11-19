import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  LinkFansQueryDto,
  TrackingLinksQueryDto,
} from './dto/tracking-links-query.dto';
import { TrackingLinksService } from './tracking-links.service';

@ApiTags('Tracking Links & Marketing')
@ApiBearerAuth()
@Controller('tracking-links')
export class TrackingLinksController {
  constructor(private readonly trackingLinksService: TrackingLinksService) { }

  @Get()
  @ApiOperation({
    summary:
      'Get tracking links, free trial links, and profile promotions with click, subscriber, conversion rate, and attributed revenue analytics',
  })
  async getTrackingLinks(@Query() query: TrackingLinksQueryDto) {
    return this.trackingLinksService.getTrackingLinksAnalytics(query);
  }

  @Get('fans')
  @ApiOperation({
    summary:
      'Get fans acquired through a specific tracking link, free trial link, or profile promotion',
  })
  async getLinkFans(@Query() query: LinkFansQueryDto) {
    return this.trackingLinksService.getLinkFansBreakdown(query);
  }
}
