import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

/**
 * Configuración principal de la aplicación Angular
 * Proporciona router, HTTP client con interceptor de autenticación, y animaciones para PrimeNG
 * provideAppInitializer: Verifica el estado de autenticación antes de que la app inicie
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideMarkdown(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false
        }
      }
    }),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.checkAuthStatus();
    })
  ]
};
