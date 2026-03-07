export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}
