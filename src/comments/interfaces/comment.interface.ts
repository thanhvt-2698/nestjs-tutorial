export interface CommentAuthorResponse {
  bio: string | null;
  following: boolean;
  image: string | null;
  username: string;
}

export interface CommentResponse {
  author: CommentAuthorResponse;
  body: string;
  createdAt: string;
  id: string;
  updatedAt: string;
}

export interface CommentResponseEnvelope {
  comment: CommentResponse;
}

export interface CommentListQuery {
  limit: number;
  offset: number;
}

export interface CommentListResponse {
  comments: CommentResponse[];
  commentsCount: number;
}

export interface CreateCommentInput {
  body: string;
}
