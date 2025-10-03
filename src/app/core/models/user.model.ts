/**
 * Modelos de datos para Usuario
 */

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response interface
 *
 * Security Note: Token is NOT included in response.
 * Token is set as httpOnly cookie by backend.
 */
export interface LoginResponse {
  user: User;
  message: string;
  // Token removed - now in httpOnly cookie
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResponse extends User {
  // Backend returns User object directly, not wrapped
}
