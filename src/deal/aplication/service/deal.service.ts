import { Injectable, NotFoundException } from '@nestjs/common';
import { Deal } from '../../domain/deal.entity';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { logger } from '../../../logger/logger';

@Injectable()
export class DealService {
  deals: Deal[] = [];

  async uploadDealFile(file: Express.Multer.File) {
    if (!file || !file.path) {
      throw new Error('Archivo inválido o no recibido');
    }

    await new Promise((resolve, reject) => {
      this.deals = [];

      const stream = fs.createReadStream(file.path);

      stream
        .pipe(csv())
        .on('data', (data) => {
          try {
            const deal: Deal = {
              id: data.deal_id,
              representative: data.rep,
              commission: 0,
              date: data.deal_date,
              status: data.status,
              amount: parseFloat(data.deal_amount),
            };

            if (deal.status === 'completed') {
              deal.commission = this.calculateDealCommission(deal);
            }

            this.deals.push(deal);
          } catch (error) {
            logger.error('Error line: ' + data.id + ' ' + error);
            stream.destroy();
            reject(error);
          }
        })
        .on('end', () => {
          resolve(this.deals);
        })
        .on('error', (error) => {
          logger.error('Error reading file: ' + error);
          stream.destroy();
          reject(error);
        });
    });

    return 'File uploaded successfully';
  }

  getDealCommission(dealId: string) {
    const deal = this.deals.find((deal) => deal.id === dealId);

    if (!deal) {
      logger.warn(`Deal with ${dealId} not found`);
      throw new NotFoundException(`Deal with ${dealId} not found`);
    }

    return { commission: deal?.commission };
  }

  getRepresentativeCommission(representativeName: string, month: string) {
    const deals = this.deals
      .filter(
        (deal) =>
          deal.representative === representativeName &&
          deal.date.startsWith(month),
      )
      .reduce((totalCommission, deal) => totalCommission + deal.commission, 0);

    if (!deals) {
      logger.warn(`Representative ${representativeName} not found`);
      throw new NotFoundException(
        `Representative ${representativeName} not found`,
      );
    }

    return { deals };
  }

  getMonthTotalCommissions(month: string) {
    const deals = this.deals
      .filter((deal) => deal.date.startsWith(month))
      .reduce((totalCommission, deal) => totalCommission + deal.commission, 0);

    if (!deals) {
      return { deals: 0 };
    }

    return { deals };
  }

  private calculateDealCommission(deal: Deal): number {
    let baseCommission = 5;

    if (deal.amount > 20000) {
      baseCommission += 1;
    }

    const dealDate = new Date(deal.date);
    const currentDate = new Date();

    if (
      dealDate.getFullYear() < currentDate.getFullYear() ||
      (dealDate.getFullYear() === currentDate.getFullYear() &&
        dealDate.getMonth() < currentDate.getMonth())
    ) {
      baseCommission -= 0.5;
    }

    return (baseCommission * deal.amount) / 100;
  }
}
