import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

/**
 * Configuración de rutas de la aplicación
 * Usa lazy loading para mejorar el rendimiento
 * authGuard: Protege rutas que requieren autenticación
 * publicGuard: Previene acceso a login/register cuando ya está autenticado
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'auth/reset-password/:token',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents-list/documents-list').then(m => m.DocumentsListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents/create',
    loadComponent: () => import('./features/documents/create-document/create-document.component').then(m => m.CreateDocumentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents/edit/:id',
    loadComponent: () => import('./features/documents/create-document/create-document.component').then(m => m.CreateDocumentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents/:id',
    loadComponent: () => import('./features/documents/view-document/view-document').then(m => m.ViewDocumentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
