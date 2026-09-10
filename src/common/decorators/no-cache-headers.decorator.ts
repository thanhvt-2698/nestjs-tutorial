import { applyDecorators, Header } from '@nestjs/common';

const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_CONTROL_VALUE = 'no-store, no-cache, must-revalidate';
const EXPIRES_HEADER = 'Expires';
const EXPIRES_VALUE = '0';
const PRAGMA_HEADER = 'Pragma';
const PRAGMA_VALUE = 'no-cache';

export function noCacheHeaders(): MethodDecorator {
  return applyDecorators(
    Header(CACHE_CONTROL_HEADER, CACHE_CONTROL_VALUE),
    Header(EXPIRES_HEADER, EXPIRES_VALUE),
    Header(PRAGMA_HEADER, PRAGMA_VALUE),
  );
}
