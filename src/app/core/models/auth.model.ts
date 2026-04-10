import type { UserRole } from './user.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthMessageResponse {
  message: string;
}

export interface PasswordRecoveryRequest {
  username: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string;
  roles: string[];
  role: Exclude<UserRole, 'SYSTEM'>;
}

export interface UserSession {
  token: string;
  username: string;
  email: string;
  roles: string[];
  user: SessionUser;
}
