import { Module } from '@nestjs/common';
import { ChattersController } from './chatters.controller';
import { ChattersService } from './chatters.service';

@Module({
  controllers: [ChattersController],
  providers: [ChattersService],
  exports: [ChattersService],
})
export class ChattersModule {}
