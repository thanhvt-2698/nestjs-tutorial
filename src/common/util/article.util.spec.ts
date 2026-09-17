import { normalizeTagList, slugify } from './article.util';

describe('article utilities', () => {
  it('normalizes and deduplicates tags', () => {
    expect(normalizeTagList([' NestJS ', 'typescript', 'nestjs', ''])).toEqual([
      'nestjs',
      'typescript',
    ]);
  });

  it('creates an ASCII slug', () => {
    expect(slugify('  Xây dựng API NestJS!  ')).toBe('xay-dung-api-nestjs');
  });

  it('uses a default slug when the title has no slugifiable characters', () => {
    expect(slugify('你好')).toBe('article');
  });
});
