import { Module } from '@nestjs/common';
import { DealController } from './controller/deal.controller';
import { DealService } from './aplication/service/deal.service';

@Module({
  controllers: [DealController],
  providers: [DealService],
})
export class DealModule {}
