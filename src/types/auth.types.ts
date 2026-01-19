// API Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;  // ISO format: "2000-01-15"
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface LogoutRequest {
  token: string;
}

// API Response Types
export interface AuthenticationResponse {
  token: string;
  expiryTime: string;  // ISO date string
}

export interface UserProfileResponse {
  email: string;
  full_name: string;
  avatar_url: string | null;
  phoneNumber: string | null;
  dateOfBirth: string;
  targetBand: number | null;
}

export interface ApiResponse<T> {
  result?: T;
  message?: string;
  code?: number;
}

// Store Types
export interface User {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
}

export interface AuthState {
  token: string | null;
  expiryTime: Date | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  setAuth: (token: string, expiryTime: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  clearAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;
