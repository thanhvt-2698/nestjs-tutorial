export interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface UserResponse {
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
}
