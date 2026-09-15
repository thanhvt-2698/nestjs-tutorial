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
    bio: string | null;
    email: string;
    image: string | null;
    passwordHash?: string;
    token: string;
    username: string;
  };
}

interface CurrentUserResponseBody {
  user: Omit<AuthResponseBody['user'], 'passwordHash' | 'token'>;
}

interface ProfileResponseBody {
  profile: {
    bio: string | null;
    image: string | null;
    following: boolean;
    username: string;
  };
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

  it('updates the current user and rotates the JWT', async () => {
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
    const oldToken = (registerResponse.body as AuthResponseBody).user.token;

    const updateResponse = await request(app.getHttpServer())
      .put('/api/user')
      .set('Authorization', `Bearer ${oldToken}`)
      .send({
        user: {
          bio: 'Backend developer',
          image: 'https://example.com/avatar.png',
          username: 'new_jake',
        },
      })
      .expect(200);

    const updateResponseBody = updateResponse.body as AuthResponseBody;

    expect(updateResponseBody.user).toMatchObject({
      bio: 'Backend developer',
      email: 'jake@example.com',
      image: 'https://example.com/avatar.png',
      username: 'new_jake',
    });
    expect(updateResponseBody.user.token).toEqual(expect.any(String));
    expect(updateResponseBody.user.token).not.toBe(oldToken);

    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
        },
      })
      .expect(200);
  });

  it('updates the password without clearing existing profile fields', async () => {
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
    const token = (registerResponse.body as AuthResponseBody).user.token;

    const updateResponse = await request(app.getHttpServer())
      .put('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ user: { password: 'NewPassword123!' } })
      .expect(200);

    expect(updateResponse.body as AuthResponseBody).toMatchObject({
      user: {
        bio: null,
        email: 'jake@example.com',
        image: null,
        username: 'jake',
      },
    });

    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
        },
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'NewPassword123!',
        },
      })
      .expect(200);
  });

  it('rejects email updates and duplicate username updates', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);

    const secondRegisterResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'alex@example.com',
          password: 'Password123!',
          username: 'alex',
        },
      })
      .expect(201);
    const secondToken = (secondRegisterResponse.body as AuthResponseBody).user
      .token;

    await request(app.getHttpServer())
      .put('/api/user')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ user: { email: 'jake@example.com' } })
      .expect(400);

    await request(app.getHttpServer())
      .put('/api/user')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ user: { username: 'jake' } })
      .expect(409);
  });

  it('returns a public profile without exposing private user data', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);

    const profileResponse = await request(app.getHttpServer())
      .get('/api/profiles/jake')
      .expect(200);
    const profileResponseBody = profileResponse.body as ProfileResponseBody;

    expect(profileResponseBody).toEqual({
      profile: {
        bio: null,
        following: false,
        image: null,
        username: 'jake',
      },
    });
    expect(profileResponseBody.profile).not.toHaveProperty('email');
    expect(profileResponseBody.profile).not.toHaveProperty('passwordHash');
  });

  it('returns not found for an unknown public profile', async () => {
    await request(app.getHttpServer())
      .get('/api/profiles/unknown-user')
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
