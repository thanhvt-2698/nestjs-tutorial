export interface ArticleAuthorResponse {
  bio: string | null;
  following: boolean;
  image: string | null;
  username: string;
}

export interface ArticleResponse {
  author: ArticleAuthorResponse;
  body: string;
  createdAt: string;
  description: string;
  favorited: boolean;
  favoritesCount: number;
  slug: string;
  tagList: string[];
  title: string;
  updatedAt: string;
}

export interface ArticleResponseEnvelope {
  article: ArticleResponse;
}

export interface CreateArticleInput {
  body: string;
  description: string;
  tagList?: string[];
  title: string;
}

export interface UpdateArticleInput {
  body?: string;
  description?: string;
  tagList?: string[];
  title?: string;
}
