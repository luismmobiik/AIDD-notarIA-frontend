import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticación funcional
 * Protege rutas que requieren autenticación
 * Redirige a /auth/login si el usuario no está autenticado
 * Preserva la URL de retorno para redirigir después del login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir a login si no está autenticado, preservando la URL solicitada
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
