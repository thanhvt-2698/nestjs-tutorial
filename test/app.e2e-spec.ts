import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { UserEntity } from './../src/users/entities/user.entity';
import { UsersService } from './../src/users/users.service';

interface AuthResponseBody {
  user: {
    bio: null;
    email: string;
    image: null;
    passwordHash?: string;
    token: string;
    username: string;
  };
}

interface CurrentUserResponseBody {
  user: Omit<AuthResponseBody['user'], 'passwordHash' | 'token'>;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<UserEntity>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    userRepository = app.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    await userRepository.clear();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers a user and returns a JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);

    const responseBody = response.body as AuthResponseBody;

    expect(responseBody.user).toMatchObject({
      bio: null,
      email: 'jake@example.com',
      image: null,
      username: 'jake',
    });
    expect(responseBody.user.token).toEqual(expect.any(String));
    expect(responseBody.user.passwordHash).toBeUndefined();

    const storedUser = await app
      .get(UsersService)
      .findByEmail('jake@example.com');
    expect(storedUser?.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(storedUser?.passwordHash).not.toBe('Password123!');
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: 'JAKE@example.com',
          password: 'Password123!',
        },
      })
      .expect(200);

    const loginResponseBody = loginResponse.body as AuthResponseBody;

    expect(loginResponseBody.user.token).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'wrong-password',
        },
      })
      .expect(401);
  });

  it('protects the current-user endpoint and accepts the Token scheme', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);

    const registerResponseBody = registerResponse.body as AuthResponseBody;
    const token = registerResponseBody.user.token;

    await request(app.getHttpServer()).get('/api/user').expect(401);

    await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', 'Token invalid.jwt.token')
      .expect(401);

    const currentUserResponse = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(currentUserResponse.body as CurrentUserResponseBody).toEqual({
      user: {
        bio: null,
        email: 'jake@example.com',
        image: null,
        username: 'jake',
      },
    });
  });

  it('rejects duplicate users and unknown registration fields', async () => {
    const payload = {
      user: {
        email: 'jake@example.com',
        password: 'Password123!',
        username: 'jake',
      },
    };

    await request(app.getHttpServer())
      .post('/api/users')
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/users')
      .send(payload)
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          ...payload.user,
          role: 'admin',
        },
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
