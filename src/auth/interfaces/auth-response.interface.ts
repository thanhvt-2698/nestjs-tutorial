import { UserResponse } from '../../users/interfaces/user.interface';

export interface AuthUserResponse extends UserResponse {
  token: string;
}

export interface AuthResponse {
  user: AuthUserResponse;
}
