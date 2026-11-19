import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RefreshableDateRangeQueryDto } from '../infloww/dto/infloww-query.dto';
import { ChattersService } from './chatters.service';
import { ChattersQueryDto } from './dto/chatters-query.dto';

@ApiTags('Chatters')
@ApiBearerAuth()
@Controller('chatters')
export class ChattersController {
  constructor(private readonly chattersService: ChattersService) { }

  @Get()
  @ApiOperation({
    summary:
      'List chatters/employees with verified employee-level sales and chatting statistics',
  })
  async getChatters(@Query() query: ChattersQueryDto) {
    return this.chattersService.getChattersList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get detailed sales breakdown, assigned creators, and daily chatting performance for a chatter',
  })
  @ApiParam({ name: 'id', description: 'Infloww Employee ID' })
  async getChatterById(
    @Param('id') id: string,
    @Query() query: RefreshableDateRangeQueryDto,
  ) {
    return this.chattersService.getChatterById(
      id,
      query.startDate,
      query.endDate,
      query.refresh,
    );
  }
}
