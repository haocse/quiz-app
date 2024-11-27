export interface User {
  username: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}