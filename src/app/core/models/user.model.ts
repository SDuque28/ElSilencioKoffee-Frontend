export type UserRole = 'ADMIN' | 'USER' | 'SYSTEM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Exclude<UserRole, 'SYSTEM'>;
  createdAt: string;
}
