import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { getJwtSecret } from '../../config/jwt.config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../../users/interfaces/user.interface';

const APPLICATION_JSON_CONTENT_TYPE = 'application/json';

function extractToken(request: Request): string | null {
  const contentType = request.headers['content-type'];

  if (
    contentType &&
    !contentType.toLowerCase().startsWith(APPLICATION_JSON_CONTENT_TYPE)
  ) {
    return null;
  }

  const authorization = request.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (!token || !/^(Bearer|Token)$/i.test(scheme)) {
    return null;
  }

  return token;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromExtractors([extractToken]),
      secretOrKey: getJwtSecret(),
    });
  }

  validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.validateJwtPayload(payload);
  }
}
