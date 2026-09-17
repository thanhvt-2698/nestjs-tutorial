# NestJS Tutorial — Medium Clone API

Backend API được xây dựng bằng NestJS, lấy cảm hứng từ [RealWorld specification](https://realworld-docs.netlify.app/). Project cung cấp nền tảng cho một ứng dụng chia sẻ bài viết kiểu Medium, không bao gồm frontend.

## Chức năng

- Đăng ký và đăng nhập người dùng bằng JWT.
- Lấy thông tin người dùng hiện tại bằng JWT.
- Cập nhật username, password, bio và image của user hiện tại.
- Xem profile public theo username.
- CRUD bài viết với slug ổn định, author profile và phân quyền theo tác giả.
- Tạo, xem và xóa comment trên bài viết; không hỗ trợ cập nhật comment.
- Lấy danh sách bài viết theo trang, sắp xếp mới nhất trước và lọc theo tag/author.
- Validate request body và giới hạn tốc độ request đăng nhập.
- Lưu trữ user trong PostgreSQL thông qua TypeORM.
- Tài liệu API tương tác bằng Swagger/OpenAPI.

## Công nghệ

- Node.js `22.22.3` trở lên.
- NestJS 11 và TypeScript strict mode.
- PostgreSQL 16 và Docker Compose.
- TypeORM, Passport, JWT và bcrypt.
- Jest và Supertest.

## Yêu cầu môi trường

- Node.js `22.22.3` hoặc cao hơn.
- npm.
- Docker và Docker Compose.

Phiên bản Node.js của project được khai báo trong [.tool-versions](.tool-versions). Kiểm tra môi trường:

```bash
node --version
npm --version
docker --version
docker compose version
```

## Cài đặt

Clone repository và cài dependencies:

```bash
git clone git@github.com:thanhvt-2698/nestjs-tutorial.git
cd nestjs-tutorial
npm ci
```

Tạo file environment local:

```bash
cp .env.example .env
```

Các biến môi trường được hỗ trợ:

| Tên              | Mô tả                      | Giá trị mặc định       |
| ---------------- | -------------------------- | ---------------------- |
| `PORT`           | Port của HTTP server       | `3000`                 |
| `JWT_SECRET`     | Secret dùng để ký JWT      | Bắt buộc thay đổi      |
| `JWT_EXPIRES_IN` | Thời hạn JWT               | `1h`                   |
| `DB_HOST`        | Host PostgreSQL            | `localhost`            |
| `DB_PORT`        | Port PostgreSQL            | `5432`                 |
| `DB_USERNAME`    | User PostgreSQL            | `nestjs`               |
| `DB_PASSWORD`    | Password PostgreSQL        | `nestjs`               |
| `DB_NAME`        | Database chính             | `nestjs_tutorial`      |
| `DB_TEST_NAME`   | Database dành cho e2e test | `nestjs_tutorial_test` |

`JWT_SECRET` phải là một secret ngẫu nhiên đủ dài. Không commit file `.env` hoặc secret thật vào repository.

## Database và migration

Khởi động PostgreSQL local:

```bash
docker compose up -d
docker compose ps
```

Database được tạo bởi Docker Compose. Bảng `users`, `articles` và `comments`, cùng các index phục vụ truy vấn danh sách bài viết, được tạo bởi migration trong [src/database/migrations](src/database/migrations), không dùng TypeORM `synchronize`.

Chạy migration thủ công:

```bash
npm run db:migration:show
npm run db:migration:run
```

Khi thay đổi schema, tạo migration mới và chạy migration đó trong môi trường development/production. Hai môi trường sử dụng cùng migration files trong source code.

Ứng dụng không tự động chạy migration khi khởi động. Migration phải được chạy chủ động bằng lệnh trước khi start app:

```bash
npm run db:migration:run
```

Các lệnh database khác:

```bash
npm run db:migration:revert
docker compose down
```

`docker compose down -v` sẽ xóa PostgreSQL volume và toàn bộ dữ liệu local, chỉ sử dụng khi muốn tạo lại database từ đầu.

## Chạy project

Sau khi PostgreSQL đã chạy và migration đã hoàn tất:

```bash
npm run start:dev
```

Các URL local:

- API: [http://localhost:3000](http://localhost:3000)
- Health endpoint: [http://localhost:3000/](http://localhost:3000/)
- Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)
- OpenAPI JSON: [http://localhost:3000/docs-json](http://localhost:3000/docs-json)

Build và chạy production:

```bash
npm run db:migration:run
npm run build
npm run start:prod
```

## Authentication API

Base path của API là `/api`.

| Method | Endpoint                  | Mô tả                  |
| ------ | ------------------------- | ---------------------- |
| `POST` | `/api/users`              | Đăng ký user           |
| `POST` | `/api/users/login`        | Đăng nhập              |
| `GET`  | `/api/user`               | Lấy user hiện tại      |
| `PUT`  | `/api/user`               | Cập nhật user hiện tại |
| `GET`  | `/api/profiles/:username` | Lấy profile public     |

## Articles API

| Method   | Endpoint              | Auth         | Mô tả                  |
| -------- | --------------------- | ------------ | ---------------------- |
| `POST`   | `/api/articles`       | JWT          | Tạo bài viết           |
| `GET`    | `/api/articles`       | Public       | Lấy danh sách bài viết |
| `GET`    | `/api/articles/:slug` | Public       | Lấy bài viết theo slug |
| `PUT`    | `/api/articles/:slug` | JWT + author | Cập nhật bài viết      |
| `DELETE` | `/api/articles/:slug` | JWT + author | Xóa bài viết           |

Tags được trim, chuyển thành chữ thường, loại bỏ phần tử rỗng và deduplicate. Slug được tạo từ title; nếu bị trùng, hệ thống thêm hậu tố tuần tự như `-2`. Khi đổi title bằng `PUT`, slug hiện tại được giữ nguyên để URL không thay đổi. `favorited` và `following` trả về `false` cho tới khi các phase favorites/following được triển khai.

Danh sách bài viết hỗ trợ các query parameter `limit` (mặc định `20`, tối đa `100`), `offset` (mặc định `0`), `tag` và `author`. Kết quả có dạng `{ "articles": [...], "articlesCount": 0 }` và được sắp xếp theo `createdAt DESC`, sau đó `id DESC` để phân trang ổn định:

```bash
curl "http://localhost:3000/api/articles?tag=nestjs&author=jake&limit=10&offset=0"
```

Chỉ author của bài viết mới được phép `PUT` hoặc `DELETE`; `authorId`, `favoritesCount` và các trường nội bộ không được nhận từ request.

## Comments API

| Method   | Endpoint                           | Auth                 | Mô tả                      |
| -------- | ---------------------------------- | -------------------- | -------------------------- |
| `GET`    | `/api/articles/:slug/comments`     | Public               | Lấy danh sách comment      |
| `POST`   | `/api/articles/:slug/comments`     | JWT                  | Tạo comment                |
| `DELETE` | `/api/articles/:slug/comments/:id` | JWT + comment author | Xóa comment của chính mình |

Endpoint list comment hỗ trợ `limit` (mặc định `20`, tối đa `100`) và `offset` (mặc định `0`). Response có dạng `{ "comments": [...], "commentsCount": 0 }` và được sắp xếp theo comment mới nhất trước.

Comment body được trim và giới hạn tối đa 10.000 ký tự. `authorId` và `articleId` luôn được lấy từ JWT/slug, không nhận từ request. Comment không có endpoint update; khi xóa article, các comment liên quan được xóa bằng foreign key `ON DELETE CASCADE`.

Các endpoint cần xác thực sử dụng một trong hai header sau:

```text
Authorization: Bearer <jwt>
Authorization: Token <jwt>
```

## Kiểm thử và coding standard

Unit test:

```bash
npm test -- --runInBand
```

E2E test cần migration cho database test trước khi chạy:

```bash
npm run db:migration:show:test
npm run db:migration:run:test
npm run test:e2e -- --runInBand
```

E2E test sử dụng database trong `DB_TEST_NAME` và xóa dữ liệu user test trước mỗi test case.

Kiểm tra code trước khi tạo pull request:

```bash
npm run lint
npm run lint:sun
npm run build
npx prettier --check "src/**/*.ts" "test/**/*.ts"
npx tsc --noEmit
```

Project áp dụng [SunLint](https://coding-standards.sun-asterisk.vn/docs/installation) và [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

## Npm scripts chính

```bash
npm run start:dev        # Development server với watch mode
npm run start            # Chạy server bình thường
npm run start:prod       # Chạy bản build trong dist/
npm run build            # Compile TypeScript
npm run lint             # ESLint
npm run lint:sun         # SunLint
npm test                 # Unit test
npm run test:e2e         # End-to-end test
npm run test:cov         # Test coverage
npm run db:migration:show
npm run db:migration:run
npm run db:migration:revert
npm run db:migration:show:test
npm run db:migration:run:test
```

## Cấu trúc thư mục

```text
.
├── docker/                  # PostgreSQL initialization scripts
├── src/
│   ├── articles/             # Article entity, CRUD service/controller và DTO
│   ├── auth/                # Registration, login và JWT authentication
│   ├── comments/             # Comment entity, CRUD service/controller và DTO
│   ├── config/              # Application và database configuration
│   ├── database/migrations/ # TypeORM migrations
│   ├── users/               # User controllers, DTOs, entity và service
│   ├── app.module.ts
│   └── main.ts
├── test/                    # End-to-end tests
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

## Tài liệu tham khảo

- [NestJS documentation](https://docs.nestjs.com/)
- [NestJS database techniques](https://docs.nestjs.com/techniques/database)
- [TypeORM migrations](https://typeorm.io/docs/migrations/setup/)
- [RealWorld specification](https://realworld-docs.netlify.app/)
