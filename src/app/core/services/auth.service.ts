import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, of, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { ErrorHandlerService } from './error-handler.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User
} from '../models/user.model';

/**
 * Authentication Service - httpOnly Cookie Implementation
 *
 * Security: Token stored in httpOnly cookie by backend
 * - XSS Protection: JavaScript cannot access the cookie
 * - CSRF Protection: SameSite cookie attribute
 * - No localStorage usage for token storage
 *
 * Manages login, registration, logout, and authentication state using Signals
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal for authentication state
  public isAuthenticated = signal<boolean>(false);

  // Signal for current user
  public currentUser = signal<User | null>(null);

  private apiService = inject(ApiService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Check authentication status by calling /me endpoint
   * Cookie sent automatically with request (withCredentials: true)
   * Returns a Promise that resolves when auth status is determined
   */
  checkAuthStatus(): Promise<void> {
    return firstValueFrom(
      this.apiService.get<User>('/auth/me').pipe(
        tap(user => {
          // Valid cookie and user found
          this.isAuthenticated.set(true);
          this.currentUser.set(user);
        }),
        catchError(() => {
          // No cookie, invalid cookie, or token expired
          this.isAuthenticated.set(false);
          this.currentUser.set(null);
          return of(null);
        })
      )
    ).then(() => void 0);
  }

  /**
   * Login user - Token stored in httpOnly cookie by backend
   * @param credentials User email and password
   * @returns Observable with login response (user data, NO token in response)
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials)
      .pipe(
        tap(response => {
          // Cookie is set automatically by backend response
          // No localStorage usage - XSS-safe
          this.isAuthenticated.set(true);
          this.currentUser.set(response.user);
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.apiService.post<RegisterResponse>('/auth/register', userData);
  }

  /**
   * Logout user - Clears httpOnly cookie via backend API
   * @returns Observable that completes when logout successful
   */
  logout(): Observable<void> {
    return this.apiService.post<void>('/auth/logout', {}).pipe(
      tap(() => {
        // Cookie cleared by backend
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        // Even if backend fails, clear local state for security
        this.errorHandler.logError('Logout error', error);
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
        return of(void 0);
      })
    );
  }

  /**
   * Request password recovery
   */
  forgotPassword(email: string): Observable<any> {
    return this.apiService.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
  }
}
