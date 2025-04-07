import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DealService } from '../aplication/service/deal.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetRepresentativeCommissionDto } from '../aplication/dto/get-representative-commission.dto';

@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post('uploadDealFile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix);
        },
      }),
    }),
  )
  uploadDealFile(@UploadedFile() file: Express.Multer.File) {
    return this.dealService.uploadDealFile(file);
  }

  @Get(':dealId')
  getDealCommission(@Param('dealId') dealId: string) {
    return this.dealService.getDealCommission(dealId);
  }

  @Get('representative/:representativeName')
  getRepresentativeCommission(
    @Param('representativeName') representativeName: string,
    @Query() getRepresentativeCommissionDto: GetRepresentativeCommissionDto,
  ) {
    return this.dealService.getRepresentativeCommission(
      representativeName,
      getRepresentativeCommissionDto.month,
    );
  }

  @Get('month-total/:month')
  getMonthTotalCommissions(@Param('month') month: string) {
    return this.dealService.getMonthTotalCommissions(month);
  }
}
