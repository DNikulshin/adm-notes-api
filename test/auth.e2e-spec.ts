import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Authentication and User Flow (e2e)', () => {
  let app: INestApplication;
  let server: any;

  let accessToken: string;

  const email = `testuser_${Date.now()}@test.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /users/register - should register a new user and return tokens', async () => {
    const response = await request(server)
      .post('/users/register')
      .send({ email, password })
      .expect(HttpStatus.CREATED);

    expect(response.body).toHaveProperty('accessToken');

    accessToken = response.body.accessToken;
  });

  it('2. GET /users/profile - should access a protected route after registration', async () => {
    const response = await request(server)
      .get('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
    expect(response.body.email).toEqual(email);
  });

  it('3. POST /auth/login - should log the user in again and return new tokens', async () => {
    const response = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('accessToken');

    accessToken = response.body.accessToken;
  });
});
