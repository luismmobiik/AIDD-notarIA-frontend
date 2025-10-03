import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard público funcional (guard inverso)
 * Previene que usuarios autenticados accedan a rutas públicas como login/register
 * Redirige a /dashboard si el usuario ya está autenticado
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Usuario no autenticado puede acceder a rutas públicas
    return true;
  }

  // Usuario autenticado es redirigido al dashboard
  router.navigate(['/dashboard']);
  return false;
};
