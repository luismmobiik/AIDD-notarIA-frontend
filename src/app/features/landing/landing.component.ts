import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

/**
 * Interfaz para las tarjetas de servicios
 * Define la estructura de cada servicio ofrecido
 */
interface ServiceCard {
  icon: string;
  title: string;
  description: string;
}

/**
 * Interfaz para las tarjetas de beneficios
 * Define la estructura de cada beneficio destacado
 */
interface BenefitCard {
  icon: string;
  title: string;
  description: string;
  iconBgColor: string;
}

/**
 * Componente de página de inicio (Landing Page)
 * Muestra hero section, servicios disponibles, beneficios y footer
 *
 * Aplicando SOLID:
 * - SRP: Responsabilidad única de presentar la landing page
 * - OCP: Extensible mediante los arrays de servicios y beneficios
 * - DIP: Depende de abstracciones (interfaces) no implementaciones
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ButtonModule, CardModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  // Inyección de dependencias usando inject() (Angular 20+)
  private readonly router = inject(Router);

  // Títulos y textos principales
  readonly title = 'NotarIA Digital';
  readonly subtitle = 'Legalidad al alcance de todos';
  readonly description = 'Servicios notariales modernos con asesoría de inteligencia artificial. Crea, gestiona y notariza tus documentos legales de forma rápida y segura.';

  /**
   * Signal con los servicios disponibles
   * Usa Signal para mantener reactividad si se agregan servicios dinámicamente
   */
  readonly services = signal<ServiceCard[]>([
    {
      icon: 'pi pi-file-edit',
      title: 'Contratos',
      description: 'Compraventa, arrendamiento y prestación de servicios'
    },
    {
      icon: 'pi pi-shield',
      title: 'Escrituras',
      description: 'Propiedad y constitución de empresas'
    },
    {
      icon: 'pi pi-file',
      title: 'Testamentos',
      description: 'Protege el futuro de tu familia'
    },
    {
      icon: 'pi pi-users',
      title: 'Poderes Notariales',
      description: 'Otorga representación legal'
    },
    {
      icon: 'pi pi-briefcase',
      title: 'Actas Constitutivas',
      description: 'Formaliza tu empresa'
    },
    {
      icon: 'pi pi-comments',
      title: 'Asesoría AI',
      description: 'Consulta con nuestro asistente legal inteligente'
    }
  ]);

  /**
   * Signal con los beneficios de usar la plataforma
   * Usa Signal para mantener reactividad
   */
  readonly benefits = signal<BenefitCard[]>([
    {
      icon: 'pi pi-clock',
      title: 'Rápido y Eficiente',
      description: 'Completa tus trámites en minutos, no en días',
      iconBgColor: '#10b981'
    },
    {
      icon: 'pi pi-shield',
      title: 'Seguro y Confiable',
      description: 'Tus documentos protegidos con la más alta seguridad',
      iconBgColor: '#10b981'
    },
    {
      icon: 'pi pi-check-circle',
      title: 'Fácil de Usar',
      description: 'Interfaz intuitiva con asesoría AI en cada paso',
      iconBgColor: '#10b981'
    }
  ]);

  /**
   * Navega a la página de registro
   */
  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Navega a la página de inicio de sesión
   */
  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Scroll suave a una sección específica
   * @param sectionId ID de la sección destino
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
