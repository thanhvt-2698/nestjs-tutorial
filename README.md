# NestJS Tutorial — Medium Clone API

Backend API project dùng NestJS để thực hành xây dựng một phiên bản Medium clone theo [RealWorld specification](https://realworld-docs.netlify.app/). Project tập trung vào backend, không xây dựng frontend.

## Mục tiêu học tập

Trong quá trình triển khai, project tập trung vào các kiến thức trọng tâm của NestJS:

- Kiến trúc modular và cách tổ chức `@Module()`.
- Xây dựng routes, controllers và API endpoints với `@Get()`, `@Post()`, `@Patch()` và `@Delete()`.
- Kết nối database bằng TypeORM với PostgreSQL hoặc MySQL.
- Authentication bằng JWT.
- Validation, pipes, filters, exception handling và middleware.
- Viết test, self-review và review chéo theo coding convention.

Thời lượng dự kiến: khoảng 10 ngày.

## Feature roadmap

| # | Chức năng | Phạm vi chính | Ưu tiên |
|---|---|---|---|
| 1 | Authentication với JWT | Sign up, login, xác thực request và logout ở client | Bắt buộc |
| 2 | Users | CRU user, settings và public profile; không xóa user | Bắt buộc |
| 3 | Articles | CRUD article, slug, tags và ownership | Bắt buộc |
| 4 | Comments | Create/read/delete comment; không update comment | Bắt buộc |
| 5 | Article lists | Danh sách article, filter và pagination | Bắt buộc |
| 6 | Favorite articles | Favorite/unfavorite và favorites count | Tùy tiến độ |
| 7 | Follow users | Follow/unfollow và feed theo following | Tùy tiến độ |

Khuyến nghị hoàn thành 5 chức năng đầu tiên trước. Favorites và Following sẽ triển khai tùy tiến độ.

## Công nghệ

- Node.js `>=22.22.3` — phiên bản được pin trong [.tool-versions](.tool-versions).
- NestJS 11.
- TypeScript strict mode.
- npm.
- Jest cho unit test và e2e test.
- TypeORM + PostgreSQL hoặc MySQL — sẽ được bổ sung ở bước database model.
- JWT — sẽ được bổ sung ở bước Authentication.

## Project setup hiện tại

Project đã được scaffold với NestJS và có cấu trúc cơ bản:

```text
.
├── src/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .gitignore
├── .tool-versions
├── nest-cli.json
├── package.json
└── tsconfig.json
```

Các module nghiệp vụ sẽ được thêm dần theo thứ tự roadmap, tránh đưa toàn bộ feature vào một pull request.

## Cài đặt và chạy project

Kiểm tra Node.js:

```bash
node --version
```

Cài dependencies:

```bash
npm install
```

Chạy development server:

```bash
npm run start:dev
```

Mở [http://localhost:3000](http://localhost:3000). Endpoint khởi tạo `GET /` hiện trả về `Hello World!`.

Chạy production build:

```bash
npm run build
npm run start:prod
```

## Các npm scripts

```bash
npm run start          # Chạy ứng dụng
npm run start:dev      # Chạy watch mode
npm run start:prod     # Chạy bản build trong dist/
npm run build          # Compile TypeScript
npm run lint           # Kiểm tra và tự format lint issues
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage
```

## Thứ tự triển khai dự kiến

### Phase 0 — Init code base

- Scaffold NestJS TypeScript strict.
- Thiết lập npm scripts, lint, test và Node version.
- Thiết lập Git local và remote repository.

### Phase 1 — Init model

- Chọn PostgreSQL hoặc MySQL.
- Kết nối TypeORM.
- Tạo entities và migrations cho users, articles, comments, favorites và follows.
- Thiết lập relationships, indexes, unique constraints và delete policy.

### Phase 2 — Authentication và Users

- Register/login bằng JWT.
- Hash password và bảo vệ private endpoints.
- Lấy/cập nhật current user.
- Hiển thị public profile.

### Phase 3 — Articles, Comments và Lists

- CRUD articles.
- Tạo/đọc/xóa comments.
- Danh sách articles với `limit`/`offset`, filters và feed cơ bản.

### Phase 4 — Favorites và Following

- Favorite/unfavorite article.
- Follow/unfollow user.
- Tính `favorited`, `following` và following feed.

### Phase 5 — Quality và review

- Bổ sung validation, exception handling, logging và API documentation.
- Chạy build, lint, unit test và e2e test.
- Self-review trước khi gửi pull request.
- Sửa 100% Sunlint errors; warning nên được xử lý khi phù hợp.

## Git workflow

Repository sử dụng remote SSH:

```text
git@github.com:thanhvt-2698/nestjs-tutorial.git
```

Nguyên tắc làm việc:

1. Init code base trước.
2. Tạo pull request riêng cho database model và relationships.
3. Mỗi pull request chỉ nên chứa một API hoặc một nhóm thay đổi nhỏ liên quan.
4. Giữ thay đổi ở mức vài trăm dòng trở xuống khi có thể để dễ review.
5. Self-review trước khi gửi pull request.
6. Review chéo và chỉ merge sau khi nhận được ít nhất một approval.

Kiểm tra trạng thái và push branch hiện tại:

```bash
git status
git remote -v
git push -u origin main
```

## Coding standards

- [Sunlint installation và source code standards](https://coding-standards.sun-asterisk.vn/docs/installation) là tiêu chuẩn bắt buộc.
- Phải fix 100% các rule có mức `error`.
- Khuyến khích fix các rule có mức `warning`.
- Khi gửi pull request, đính kèm evidence kết quả chạy Sunlint.
- Tham khảo [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

## Tài liệu tham khảo

- [NestJS official website](https://nestjs.com/).
- [NestJS documentation](https://docs.nestjs.com/).
- [RealWorld features](https://realworld-docs.netlify.app/implementation-creation/features/).
- [RealWorld backend endpoints](https://realworld-docs.netlify.app/specifications/backend/endpoints/).
- [Medium clone wireframe trên Figma](https://www.figma.com/design/bQ02ebnAIsjwg1kTimNSPS/Medium-clone--Copy-?node-id=26-58&t=sHwGzyNSrIOFfx9q-1).

## Local-only planning notes

Thư mục `Plans/` chứa kế hoạch triển khai chi tiết cho 7 feature và được giữ local để phục vụ quá trình học tập. File `tutorial.md` cũng là tài liệu hướng dẫn local. Cả `Plans/` và `tutorial.md` đều nằm trong `.gitignore` và không được commit lên repository.
