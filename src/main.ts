import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Medium Clone API')
    .setDescription('Backend API for the NestJS Medium clone tutorial')
    .setVersion('1.0')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        description:
          'Enter a JWT token. The API also accepts the Token scheme.',
        scheme: 'bearer',
        type: 'http',
      },
      'jwt',
    )
    .addTag('Authentication', 'Registration, login and current-user endpoints')
    .addTag('Articles', 'Article CRUD endpoints')
    .addTag('Comments', 'Article comment endpoints')
    .build();
  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    jsonDocumentUrl: 'docs-json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
