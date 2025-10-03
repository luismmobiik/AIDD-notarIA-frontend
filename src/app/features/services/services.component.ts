import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../core/services/api.service';
import { Service, ServiceCategory } from '../../core/models/service.model';
import { HeaderComponent } from '../../shared/components/header/header.component';

/**
 * Componente de catálogo de servicios notariales
 * Muestra servicios en grid responsive con filtrado por categoría
 * Usa 100% Signals para manejo de estado reactivo y Angular 20+ patterns
 */
@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule,
    TagModule,
    HeaderComponent
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  // Dependency injection usando inject()
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Signals para estado reactivo
  services = signal<Service[]>([]);
  selectedCategory = signal<string>('todas');
  isLoading = signal<boolean>(true);
  error = signal<string>('');

  // Computed signal para filtrar servicios por categoría
  filteredServices = computed(() => {
    const category = this.selectedCategory();
    const allServices = this.services();

    if (category === 'todas') {
      return allServices;
    }

    return allServices.filter(s => s.category === category);
  });

  // Categorías disponibles para filtrado
  categories: ServiceCategory[] = [
    { id: 'todas', name: 'Todos', icon: 'pi-th-large' },
    { id: 'contratos', name: 'Contratos', icon: 'pi-file-edit' },
    { id: 'escrituras', name: 'Escrituras', icon: 'pi-shield' },
    { id: 'testamentos', name: 'Testamentos', icon: 'pi-book' },
    { id: 'poderes', name: 'Poderes', icon: 'pi-users' },
    { id: 'actas', name: 'Empresas', icon: 'pi-briefcase' }
  ];

  ngOnInit(): void {
    this.loadServices();
  }

  /**
   * Cargar servicios desde la API
   */
  private loadServices(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.apiService.get<Service[]>('/services')
      .subscribe({
        next: (services) => {
          this.services.set(services);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.error.set('Error al cargar los servicios. Por favor, intenta nuevamente.');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Filtrar servicios por categoría
   * Actualiza el signal selectedCategory que reactivamente filtra la lista
   */
  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Navegar a página de solicitud de servicio
   * (Placeholder para futura implementación)
   */
  navigateToRequest(serviceId: string): void {
    // TODO: Implementar navegación a página de solicitud cuando esté disponible
    console.log('Solicitar servicio:', serviceId);
    // Future implementation: this.router.navigate(['/services/request', serviceId]);
  }

  /**
   * Verificar si una categoría está activa
   */
  isCategoryActive(categoryId: string): boolean {
    return this.selectedCategory() === categoryId;
  }

  /**
   * Obtener las primeras N features de un servicio para mostrar en la tarjeta
   */
  getDisplayFeatures(features: string[], limit: number = 5): string[] {
    return features.slice(0, limit);
  }

  /**
   * Reintentar carga de servicios en caso de error
   */
  retryLoad(): void {
    this.loadServices();
  }
}
