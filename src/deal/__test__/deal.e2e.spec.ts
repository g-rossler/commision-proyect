import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../../app.module';

describe('DealController (e2e)', () => {
  let app: INestApplication;
  const uploadsDir = path.join(__dirname, '../../../../uploads');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Asegurarse de que la carpeta uploads existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
  });

  afterAll(async () => {
    await app.close();

    // Limpiar archivos en carpeta uploads
    if (fs.existsSync(uploadsDir)) {
      fs.readdirSync(uploadsDir).forEach((file) => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
  });

  describe('POST /deal/uploadDealFile', () => {
    it('should upload CSV and process deals', async () => {
      const testCsvPath = path.join(__dirname, 'mock-deals.csv');
      const csvContent = `deal_id,rep,car_model,deal_amount,deal_date,status
      D0001,Eduardo Pérez,Mazda CX-5,24546.37,2023-03-12,cancelled
      D0002,Alice Smith,Chevrolet Onix,18153.43,2023-08-06,completed`;

      fs.writeFileSync(testCsvPath, csvContent, { encoding: 'utf8' });

      const response = await request(app.getHttpServer())
        .post('/deal/uploadDealFile')
        .attach('file', testCsvPath);

      expect(response.status).toBe(201); // Multer's default status
      expect(response.text).toBe('File uploaded successfully');

      fs.unlinkSync(testCsvPath);
    });
  });

  describe('GET /deal/:dealId', () => {
    beforeAll(async () => {
      // Subir archivo antes de los tests GET
      const testCsvPath = path.join(__dirname, 'mock-deals.csv');
      const csvContent = [
        'deal_id,rep,car_model,deal_amount,deal_date,status',
        'D0001,Eduardo Pérez,Mazda CX-5,24546.37,2023-03-12,cancelled',
        'D0002,Alice Smith,Chevrolet Onix,18153.43,2023-08-06,completed',
      ].join('\n');

      fs.writeFileSync(testCsvPath, csvContent, { encoding: 'utf8' });

      await request(app.getHttpServer())
        .post('/deal/uploadDealFile')
        .attach('file', testCsvPath);

      fs.unlinkSync(testCsvPath);
    });

    it('should return commission for a valid deal', async () => {
      const response = await request(app.getHttpServer()).get('/deal/D0002');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('commission');
      expect(typeof response.body.commission).toBe('number');
    });

    it('should return 404 for invalid deal ID', async () => {
      const response = await request(app.getHttpServer()).get('/deal/INVALID');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /deal/representative/:representativeName', () => {
    it('should return total commission for representative in given month', async () => {
      const response = await request(app.getHttpServer())
        .get('/deal/representative/Alice Smith')
        .query({ month: '2023-08' });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('deals');
      expect(typeof response.body.deals).toBe('number');
    });

    it('should return 404 if representative not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/deal/representative/INVALID_NAME')
        .query({ month: '2023-08' });

      expect(response.status).toBe(404);
    });

    it('should return 404 if month format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/deal/representative/Alice Smith')
        .query({ month: '2023/08' }); // formato inválido

      expect(response.status).toBe(404);
    });
  });

  describe('GET /deal/month-total/:month', () => {
    it('should return total commission for given month', async () => {
      const response = await request(app.getHttpServer()).get(
        '/deal/month-total/2023-08',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(typeof response.body.deals).toBe('number');
    });

    it('should return 0 if no deals found for the month', async () => {
      const response = await request(app.getHttpServer()).get(
        '/deal/month-total/2025-01',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.deals).toBe(0);
    });
  });
});
