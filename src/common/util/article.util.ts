import {
  DEFAULT_ARTICLE_SLUG,
  MAX_ARTICLE_SLUG_LENGTH,
  MAX_ARTICLE_TAGS,
} from '../../articles/constants/articles.constants';

export function normalizeTagList(tagList: string[] | undefined): string[] {
  return [
    ...new Set(
      (tagList ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  ].slice(0, MAX_ARTICLE_TAGS);
}

export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_ARTICLE_SLUG_LENGTH)
    .replace(/-+$/g, '');

  return slug || DEFAULT_ARTICLE_SLUG;
}
