import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Todos API (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let createdTodoId: number;

  const email = `testuser_todo_${Date.now()}@test.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    server = app.getHttpServer();

    const registerResponse = await request(server)
      .post('/users/register')
      .send({ email, password })
      .expect(HttpStatus.CREATED);

    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /todos - should create a new todo for the authenticated user', async () => {
    const response = await request(server)
      .post('/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Test Todo' })
      .expect(HttpStatus.CREATED);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Todo');
    expect(response.body.completed).toBe(false);

    createdTodoId = response.body.id;
  });

  it('2. GET /todos - should retrieve all todos for the user', async () => {
    const response = await request(server)
      .get('/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Test Todo');
  });

  it('3. PUT /todos/:id - should update a specific todo', async () => {
    const response = await request(server)
      .put(`/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ completed: true })
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('id', createdTodoId);
    expect(response.body.completed).toBe(true);
  });

  it('4. DELETE /todos/:id - should delete a specific todo', async () => {
    await request(server)
      .delete(`/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);
  });

  it('5. GET /todos - should confirm the todo has been deleted', async () => {
    const response = await request(server)
      .get('/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);

    expect(response.body.length).toBe(0);
  });
});
