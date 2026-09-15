import 'dotenv/config';

import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigurationError } from './configuration.error';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ConfigurationError(
      'JWT_SECRET is required. Copy .env.example to .env and configure it.',
    );
  }

  return secret;
}

export function getJwtExpiresIn(): NonNullable<JwtSignOptions['expiresIn']> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '1h';

  return expiresIn as NonNullable<JwtSignOptions['expiresIn']>;
}

export function getJwtModuleOptions(): JwtModuleOptions {
  return {
    secret: getJwtSecret(),
    signOptions: {
      expiresIn: getJwtExpiresIn(),
    },
  };
}
