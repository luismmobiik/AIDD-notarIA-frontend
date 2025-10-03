import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

/**
 * HeaderComponent
 * Componente reutilizable de navegación horizontal con logo, menú y avatar de usuario
 * SRP: Solo maneja la presentación del header y navegación
 * Se utiliza en Dashboard, Profile y otras páginas principales
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    AvatarModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Dependency injection usando inject()
  private authService = inject(AuthService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);

  // Computed signal para usuario actual
  currentUser = computed(() => this.authService.currentUser());

  // Computed signal para iniciales del usuario
  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user?.name) return 'U';

    const words = user.name.trim().split(' ').filter(word => word.length > 0);

    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  });

  // Items de navegación horizontal
  navItems = [
    { label: 'Inicio', icon: 'pi-home', route: '/dashboard' },
    { label: 'Mis Documentos', icon: 'pi-file', route: '/documents' },
    { label: 'Asesoría AI', icon: 'pi-comment', route: '/chat' },
    { label: 'Servicios', icon: 'pi-briefcase', route: '/services' },
    { label: 'Perfil', icon: 'pi-user', route: '/profile' }
  ];

  /**
   * Logout - Now handles Observable response from auth service
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful, navigation handled by service
      },
      error: (error) => {
        this.errorHandler.logError('Logout error', error);
        // Still navigates to login due to catchError in service
      }
    });
  }
}
