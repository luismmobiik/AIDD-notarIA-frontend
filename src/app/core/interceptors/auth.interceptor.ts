import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Auth interceptor for httpOnly cookie authentication
 *
 * Security Implementation:
 * - Cookie is sent automatically by browser with withCredentials: true
 * - No manual Authorization header needed
 * - No token exposure in JavaScript
 *
 * Handles 401 errors by redirecting to login page
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Cookie sent automatically by browser
  // No manual header manipulation needed

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired, invalid, or missing
        // Redirect to login page
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
