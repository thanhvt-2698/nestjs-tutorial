import { normalizeTagList, slugify } from './article.util';

describe('article utilities', () => {
  it('normalizes, deduplicates, and removes empty tags', () => {
    expect(normalizeTagList([' NestJS ', 'typescript', 'nestjs', ''])).toEqual([
      'nestjs',
      'typescript',
    ]);
  });

  it('creates a URL-safe slug from an accented title', () => {
    expect(slugify('  Xây dựng API NestJS!  ')).toBe('xay-dung-api-nestjs');
  });

  it('uses a fallback slug when a title has no latin characters', () => {
    expect(slugify('你好')).toBe('article');
  });
});
