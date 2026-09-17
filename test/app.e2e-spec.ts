import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Repository } from 'typeorm';
import { CommentEntity } from './../src/comments/entities/comment.entity';
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

interface ArticleResponseBody {
  article: {
    author: {
      bio: null;
      following: false;
      image: null;
      username: string;
    };
    body: string;
    createdAt: string;
    description: string;
    favorited: false;
    favoritesCount: 0;
    slug: string;
    tagList: string[];
    title: string;
    updatedAt: string;
  };
}

interface CommentResponseBody {
  comment: {
    author: {
      bio: null;
      following: false;
      image: null;
      username: string;
    };
    body: string;
    createdAt: string;
    id: string;
    updatedAt: string;
  };
}

interface CommentListResponseBody {
  comments: CommentResponseBody['comment'][];
  commentsCount: number;
}

interface ArticleListResponseBody {
  articles: ArticleResponseBody['article'][];
  articlesCount: number;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let commentRepository: Repository<CommentEntity>;
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
    commentRepository = app.get<Repository<CommentEntity>>(
      getRepositoryToken(CommentEntity),
    );
    await userRepository.query(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
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

  it('creates and reads an article with a normalized tag list', async () => {
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

    const createResponse = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          tagList: [' NestJS ', 'typescript', 'nestjs', ''],
          title: 'How to build a NestJS API',
        },
      })
      .expect(201);

    const responseBody = createResponse.body as ArticleResponseBody;
    expect(responseBody.article).toMatchObject({
      author: {
        bio: null,
        following: false,
        image: null,
        username: 'jake',
      },
      body: 'Article content...',
      description: 'A short introduction',
      favorited: false,
      favoritesCount: 0,
      slug: 'how-to-build-a-nestjs-api',
      tagList: ['nestjs', 'typescript'],
      title: 'How to build a NestJS API',
    });
    expect(responseBody.article.createdAt).toEqual(expect.any(String));
    expect(responseBody.article.updatedAt).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/api/articles/how-to-build-a-nestjs-api')
      .expect(200)
      .expect(responseBody);
  });

  it('returns paginated articles in newest-first order', async () => {
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

    for (const title of ['First article', 'Second article', 'Third article']) {
      await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          article: {
            body: 'Article content...',
            description: 'A short introduction',
            tagList: ['nestjs'],
            title,
          },
        })
        .expect(201);
    }

    const allArticlesResponse = await request(app.getHttpServer())
      .get('/api/articles')
      .expect(200);
    const allArticles = allArticlesResponse.body as ArticleListResponseBody;

    expect(allArticles.articlesCount).toBe(3);
    expect(allArticles.articles).toHaveLength(3);
    expect(allArticles.articles.map(({ title }) => title)).toEqual([
      'Third article',
      'Second article',
      'First article',
    ]);

    const firstPageResponse = await request(app.getHttpServer())
      .get('/api/articles')
      .query({ limit: 2, offset: 0 })
      .expect(200);
    const firstPage = firstPageResponse.body as ArticleListResponseBody;

    expect(firstPage.articlesCount).toBe(3);
    expect(firstPage.articles.map(({ slug }) => slug)).toEqual(
      allArticles.articles.slice(0, 2).map(({ slug }) => slug),
    );

    const secondPageResponse = await request(app.getHttpServer())
      .get('/api/articles')
      .query({ limit: 2, offset: 2 })
      .expect(200);
    const secondPage = secondPageResponse.body as ArticleListResponseBody;

    expect(secondPage.articlesCount).toBe(3);
    expect(secondPage.articles.map(({ slug }) => slug)).toEqual(
      allArticles.articles.slice(2).map(({ slug }) => slug),
    );
  });

  it('filters articles by tag and author', async () => {
    const jakeResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);
    const jakeToken = (jakeResponse.body as AuthResponseBody).user.token;

    const alexResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'alex@example.com',
          password: 'Password123!',
          username: 'alex',
        },
      })
      .expect(201);
    const alexToken = (alexResponse.body as AuthResponseBody).user.token;

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${jakeToken}`)
      .send({
        article: {
          body: 'NestJS content...',
          description: 'NestJS introduction',
          tagList: ['nestjs'],
          title: 'NestJS Guide',
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${alexToken}`)
      .send({
        article: {
          body: 'TypeScript content...',
          description: 'TypeScript introduction',
          tagList: ['typescript'],
          title: 'TypeScript Guide',
        },
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/articles')
      .query({ author: ' JAKE ', tag: ' NESTJS ' })
      .expect(200);
    const responseBody = response.body as ArticleListResponseBody;

    expect(responseBody.articlesCount).toBe(1);
    expect(responseBody.articles[0]?.author.username).toBe('jake');
    expect(responseBody.articles[0]?.tagList).toEqual(['nestjs']);
    expect(responseBody.articles[0]?.title).toBe('NestJS Guide');
  });

  it('validates article list query parameters', async () => {
    await request(app.getHttpServer())
      .get('/api/articles')
      .query({ limit: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/articles')
      .query({ limit: 101 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/articles')
      .query({ offset: -1 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/articles')
      .query({ unexpected: true })
      .expect(400);
  });

  it('generates a unique slug for articles with the same title', async () => {
    const firstUserResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);
    const firstToken = (firstUserResponse.body as AuthResponseBody).user.token;

    const article = {
      body: 'Article content...',
      description: 'A short introduction',
      tagList: [],
      title: 'Same title',
    };

    const firstArticleResponse = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ article })
      .expect(201);

    const secondUserResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'alex@example.com',
          password: 'Password123!',
          username: 'alex',
        },
      })
      .expect(201);
    const secondToken = (secondUserResponse.body as AuthResponseBody).user
      .token;

    const secondArticleResponse = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ article })
      .expect(201);

    expect(
      (firstArticleResponse.body as ArticleResponseBody).article.slug,
    ).toBe('same-title');
    expect(
      (secondArticleResponse.body as ArticleResponseBody).article.slug,
    ).toBe('same-title-2');
  });

  it('restricts article updates and deletes to the article author', async () => {
    const ownerResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);
    const ownerToken = (ownerResponse.body as AuthResponseBody).user.token;

    const otherUserResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'alex@example.com',
          password: 'Password123!',
          username: 'alex',
        },
      })
      .expect(201);
    const otherUserToken = (otherUserResponse.body as AuthResponseBody).user
      .token;

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          tagList: ['nestjs'],
          title: 'Ownership rules',
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/articles/ownership-rules')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ article: { title: 'Not allowed' } })
      .expect(403);

    const updateResponse = await request(app.getHttpServer())
      .put('/api/articles/ownership-rules')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        article: {
          tagList: [' API ', 'nestjs', 'api'],
          title: 'Updated ownership rules',
        },
      })
      .expect(200);
    const updateBody = updateResponse.body as ArticleResponseBody;

    expect(updateBody.article).toMatchObject({
      slug: 'ownership-rules',
      tagList: ['api', 'nestjs'],
      title: 'Updated ownership rules',
    });

    await request(app.getHttpServer())
      .delete('/api/articles/ownership-rules')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete('/api/articles/ownership-rules')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/articles/ownership-rules')
      .expect(404);
  });

  it('rejects unauthenticated article creation and invalid article bodies', async () => {
    await request(app.getHttpServer())
      .post('/api/articles')
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Unauthenticated',
        },
      })
      .expect(401);

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

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Unexpected field',
        },
        unexpected: true,
      })
      .expect(400);
  });

  it('creates and lists comments with the author profile', async () => {
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

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Comments article',
        },
      })
      .expect(201);

    const createResponse = await request(app.getHttpServer())
      .post('/api/articles/comments-article/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: { body: 'This is useful, thank you!' } })
      .expect(201);
    const responseBody = createResponse.body as CommentResponseBody;

    expect(responseBody.comment).toMatchObject({
      author: {
        bio: null,
        following: false,
        image: null,
        username: 'jake',
      },
      body: 'This is useful, thank you!',
    });
    expect(responseBody.comment.id).toEqual(expect.any(String));
    expect(responseBody.comment.createdAt).toEqual(expect.any(String));
    expect(responseBody.comment.updatedAt).toEqual(expect.any(String));

    const listResponse = await request(app.getHttpServer())
      .get('/api/articles/comments-article/comments')
      .expect(200);
    const listResponseBody = listResponse.body as CommentListResponseBody;

    expect(listResponseBody.commentsCount).toBe(1);
    expect(listResponseBody.comments).toHaveLength(1);
    expect(listResponseBody.comments[0]).toEqual(responseBody.comment);
  });

  it('paginates comments and validates pagination parameters', async () => {
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

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Paginated comments article',
        },
      })
      .expect(201);

    for (const body of ['Comment 1', 'Comment 2', 'Comment 3', 'Comment 4']) {
      await request(app.getHttpServer())
        .post('/api/articles/paginated-comments-article/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({ comment: { body } })
        .expect(201);
    }

    const firstPageResponse = await request(app.getHttpServer())
      .get('/api/articles/paginated-comments-article/comments')
      .query({ limit: 2, offset: 0 })
      .expect(200);
    const firstPage = firstPageResponse.body as CommentListResponseBody;

    expect(firstPage.commentsCount).toBe(4);
    expect(firstPage.comments.map(({ body }) => body)).toEqual([
      'Comment 4',
      'Comment 3',
    ]);

    const secondPageResponse = await request(app.getHttpServer())
      .get('/api/articles/paginated-comments-article/comments')
      .query({ limit: 2, offset: 2 })
      .expect(200);
    const secondPage = secondPageResponse.body as CommentListResponseBody;

    expect(secondPage.commentsCount).toBe(4);
    expect(secondPage.comments.map(({ body }) => body)).toEqual([
      'Comment 2',
      'Comment 1',
    ]);

    for (const query of [
      { limit: 0 },
      { limit: 101 },
      { offset: -1 },
      { unexpected: true },
    ]) {
      await request(app.getHttpServer())
        .get('/api/articles/paginated-comments-article/comments')
        .query(query)
        .expect(400);
    }
  });

  it('rejects unauthenticated and invalid comment creation', async () => {
    await request(app.getHttpServer())
      .post('/api/articles/unknown-article/comments')
      .send({ comment: { body: 'Not allowed' } })
      .expect(401);

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

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Invalid comment body',
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/articles/unknown-article/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: { body: 'Article does not exist' } })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/articles/invalid-comment-body/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: { body: '   ' } })
      .expect(400);
  });

  it('allows only the comment author to delete a comment', async () => {
    const ownerResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'jake@example.com',
          password: 'Password123!',
          username: 'jake',
        },
      })
      .expect(201);
    const ownerToken = (ownerResponse.body as AuthResponseBody).user.token;

    const otherUserResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          email: 'alex@example.com',
          password: 'Password123!',
          username: 'alex',
        },
      })
      .expect(201);
    const otherUserToken = (otherUserResponse.body as AuthResponseBody).user
      .token;

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Comment ownership',
        },
      })
      .expect(201);

    const commentResponse = await request(app.getHttpServer())
      .post('/api/articles/comment-ownership/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ comment: { body: 'Owner comment' } })
      .expect(201);
    const commentId = (commentResponse.body as CommentResponseBody).comment.id;

    await request(app.getHttpServer())
      .delete(`/api/articles/comment-ownership/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete('/api/articles/comment-ownership/comments/not-a-uuid')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/articles/comment-ownership/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    const listResponse = await request(app.getHttpServer())
      .get('/api/articles/comment-ownership/comments')
      .expect(200);
    expect((listResponse.body as CommentListResponseBody).comments).toEqual([]);
  });

  it('cascades comments when their article is deleted', async () => {
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

    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        article: {
          body: 'Article content...',
          description: 'A short introduction',
          title: 'Comment cascade',
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/articles/comment-cascade/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: { body: 'This should be deleted with the article' } })
      .expect(201);

    await request(app.getHttpServer())
      .delete('/api/articles/comment-cascade')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await commentRepository.count()).toBe(0);
    await request(app.getHttpServer())
      .get('/api/articles/comment-cascade/comments')
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
