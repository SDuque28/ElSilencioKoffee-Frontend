import type { User, UserRole } from './user.model';

export interface SessionUser extends Pick<User, 'id'> {
  role: UserRole;
  name?: string;
  email?: string;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: SessionUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
