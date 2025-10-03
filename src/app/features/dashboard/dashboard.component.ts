import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import {
  DashboardData,
  DocumentSummary,
  NavItem,
  QuickAccessCard
} from '../../core/models/dashboard.model';

/**
 * Componente principal del Dashboard
 * Muestra navegación horizontal, resumen, acceso rápido, y documentos recientes
 * Usa 100% Signals para manejo de estado reactivo
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    HeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Dependency injection usando inject()
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para estado reactivo
  dashboardData = signal<DashboardData | null>(null);
  recentDocuments = signal<DocumentSummary[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);

  // Computed signals
  currentUser = computed(() => this.authService.currentUser());
  userName = computed(() => {
    const data = this.dashboardData();
    const user = this.currentUser();
    return data?.user_name || user?.name || 'Usuario';
  });

  stats = computed(() => {
    const data = this.dashboardData();
    return data?.stats || {
      total_documents: 0,
      completed_documents: 0,
      in_progress_documents: 0
    };
  });

  // Tarjetas de acceso rápido
  quickAccessCards: QuickAccessCard[] = [
    {
      title: 'Crear Documento',
      description: 'Genera un nuevo contrato, escritura o testamento',
      icon: 'pi-plus',
      route: '/documents/create',
      color: 'primary'
    },
    {
      title: 'Asesoría AI',
      description: 'Consulta con nuestro asistente legal inteligente',
      icon: 'pi-comment',
      route: '/chat',
      color: 'accent'
    },
    {
      title: 'Mis Documentos',
      description: 'Accede a todos tus documentos guardados',
      icon: 'pi-folder',
      route: '/documents',
      color: 'secondary'
    }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadRecentDocuments();
  }

  /**
   * Cargar datos del dashboard desde la API
   */
  private loadDashboardData(): void {
    this.apiService.get<DashboardData>('/dashboard')
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          // Fallback: usar datos del AuthService
          this.isLoading.set(false);
          this.hasError.set(true);
        }
      });
  }

  /**
   * Cargar documentos recientes desde la API
   */
  private loadRecentDocuments(): void {
    this.apiService.get<DocumentSummary[]>('/documents/recent?limit=5')
      .subscribe({
        next: (documents) => {
          this.recentDocuments.set(documents);
        },
        error: (error) => {
          console.error('Error loading recent documents:', error);
          // Continuar con lista vacía
        }
      });
  }

  /**
   * Navegar a una ruta específica
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Map document status to PrimeNG tag severity
   */
  getStatusSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' {
    switch (status.toLowerCase()) {
      case 'completado':
      case 'notarizado':
        return 'success';
      case 'borrador':
      case 'en proceso':
        return 'warn';
      case 'rechazado':
      case 'cancelado':
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Traducir status al español
   */
  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'borrador': 'Borrador',
      'completado': 'Completado',
      'notarizado': 'Notarizado',
      'draft': 'Borrador',
      'completed': 'Completado',
      'notarized': 'Notarizado'
    };
    return statusMap[status.toLowerCase()] || status;
  }
}
