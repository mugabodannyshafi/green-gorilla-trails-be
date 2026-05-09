import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateBookingDto } from '../src/modules/bookings/dto/create-booking.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Welcome to your NestJS application built with nestify!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
      });
  });

  it('/packages/:packageId/bookings (POST)', async () => {
    const packageId = 1;
    const payload: CreateBookingDto = {
      names: 'Test User',
      email: 'test@example.com',
      prefferedDate: '2030-01-01',
      numberOfDays: 3,
      message: 'Test booking message',
    };

    const response = await request(app.getHttpServer())
      .post(`/packages/${packageId}/bookings`)
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('package_id', packageId);
    expect(response.body).toHaveProperty('customer_name', payload.names);
    expect(response.body).toHaveProperty('email', payload.email);
  });
});
