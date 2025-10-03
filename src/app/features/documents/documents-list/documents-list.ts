import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { DataViewModule } from 'primeng/dataview';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services and Models
import { DocumentService } from '../../../core/services/document.service';
import {
  DocumentSummary,
  DocumentType,
  DocumentStatus,
  DocumentListParams
} from '../../../core/models/document.model';
import { HeaderComponent } from '../../../shared/components/header/header.component';

/**
 * DocumentsListComponent - Lista de documentos del usuario
 *
 * US-010: My Documents List
 *
 * Características:
 * - 100% Angular 20+ compliance (Signals, inject(), modern control flow, effect for debounce)
 * - 100% PrimeNG v20 compliance (p-table, p-dataView, p-select, p-button, p-tag, p-paginator)
 * - Búsqueda por nombre con debounce de 300ms usando effect()
 * - Filtros por tipo y estado con dropdowns
 * - Paginación con rows configurables (10, 20, 50)
 * - Responsive: table en desktop, dataView en mobile
 * - Botones de acción por documento (ver, editar, descargar, eliminar)
 * - Estado vacío con botón "Crear documento"
 * - Loading state con spinner
 * - Error handling con retry
 * - Todas las etiquetas en español
 *
 * SRP: Solo gestiona listado de documentos con búsqueda/filtros/paginación
 */
@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DataViewModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    ButtonModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    SkeletonModule,
    MessageModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    HeaderComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './documents-list.html',
  styleUrl: './documents-list.scss'
})
export class DocumentsListComponent implements OnInit {
  // Dependency injection con inject() - Angular 20+ pattern
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Signals para estado reactivo
  documents = signal<DocumentSummary[]>([]);
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isDownloading = signal<boolean>(false);

  // Variables para búsqueda y filtros (no signals, porque se usan con ngModel)
  searchQuery: string = '';
  searchQueryDebounced = signal<string>(''); // Debounced version
  selectedType: string | null = null;
  selectedStatus: string | null = null;

  // Signals para paginación
  first = signal<number>(0); // Offset para paginador
  rows = signal<number>(20); // Items por página

  // Opciones para dropdowns
  documentTypeOptions = signal<Array<{ label: string; value: string | null }>>([
    { label: 'Todos', value: null },
    { label: 'Contrato de Compraventa', value: 'contrato_compraventa' },
    { label: 'Contrato de Arrendamiento', value: 'contrato_arrendamiento' },
    { label: 'Contrato de Servicios', value: 'contrato_servicios' },
    { label: 'Escritura de Propiedad', value: 'escritura_propiedad' },
    { label: 'Escritura de Empresa', value: 'escritura_empresa' },
    { label: 'Testamento', value: 'testamento' },
    { label: 'Poder Notarial', value: 'poder_notarial' },
    { label: 'Acta Constitutiva', value: 'acta_constitutiva' }
  ]);

  statusOptions = signal<Array<{ label: string; value: string | null }>>([
    { label: 'Todos', value: null },
    { label: 'Borrador', value: 'borrador' },
    { label: 'Completado', value: 'completado' },
    { label: 'Notarizado', value: 'notarizado' }
  ]);

  rowsPerPageOptions = signal<number[]>([10, 20, 50]);

  // Computed signals para estado derivado
  hasDocuments = computed(() => this.documents().length > 0);
  isEmpty = computed(() => !this.isLoading() && this.documents().length === 0);

  // Effect para debounce de búsqueda (300ms)
  private searchDebounceTimer: any;
  private isInitialized = false;

  constructor() {
    // Effect para recargar cuando cambien rows per page (no first, porque ese cambia con cada página)
    effect(() => {
      const rows = this.rows();

      // Solo cargar si ya se inicializó (evitar carga doble)
      if (this.isInitialized) {
        this.first.set(0); // Reset to first page when changing rows per page
        this.loadDocuments();
      }
    });
  }

  ngOnInit(): void {
    // Carga inicial
    this.loadDocuments();
    this.isInitialized = true;
  }

  /**
   * Cargar documentos con parámetros actuales
   */
  private loadDocuments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: DocumentListParams = {
      skip: this.first(),
      limit: this.rows(),
      sort: '-created_at' // Más recientes primero
    };

    // Agregar búsqueda si existe
    const query = this.searchQuery;
    if (query && query.trim()) {
      params.q = query.trim();
    }

    // Agregar filtro de tipo si existe
    const type = this.selectedType;
    if (type) {
      params.type = type;
    }

    // Agregar filtro de estado si existe
    const status = this.selectedStatus;
    if (status) {
      params.status = status;
    }

    this.documentService.getDocuments(params).subscribe({
      next: (response) => {
        this.documents.set(response.documents);
        this.totalRecords.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar los documentos. Por favor, inténtelo de nuevo.');

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los documentos'
        });
      }
    });
  }

  /**
   * Manejar cambio en búsqueda con debounce
   */
  onSearchChange(): void {
    // Limpiar timer anterior
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Configurar nuevo timer de 300ms
    this.searchDebounceTimer = setTimeout(() => {
      this.first.set(0); // Reset pagination
      this.loadDocuments();
    }, 300);
  }

  /**
   * Manejar cambio en filtros (tipo, estado)
   */
  onFilterChange(): void {
    this.first.set(0); // Reset pagination
    this.loadDocuments();
  }

  /**
   * Limpiar todos los filtros
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = null;
    this.selectedStatus = null;
    this.first.set(0);
    this.loadDocuments(); // Recargar después de limpiar filtros
  }

  /**
   * Manejar cambio de página en paginador
   */
  onPageChange(event: any): void {
    this.first.set(event.first);

    // Si cambió rows, el effect ya recargará. Si solo cambió first, cargar manualmente
    if (event.rows === this.rows()) {
      this.loadDocuments();
    } else {
      this.rows.set(event.rows);
    }
  }

  /**
   * Navegar a vista de documento
   */
  viewDocument(document: DocumentSummary): void {
    this.router.navigate(['/documents', document.id]);
  }

  /**
   * Navegar a edición de documento
   */
  editDocument(document: DocumentSummary): void {
    if (document.status === 'borrador') {
      this.router.navigate(['/documents/edit', document.id]);
    }
  }

  /**
   * Descargar documento como PDF
   */
  downloadDocument(doc: DocumentSummary): void {
    if (!doc?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el documento'
      });
      return;
    }

    // Mostrar estado de carga
    this.isDownloading.set(true);

    this.documentService.downloadDocument(doc.id).subscribe({
      next: ({ blob, filename }) => {
        // Crear enlace temporal para descargar
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();

        // Limpiar URL temporal
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Descarga exitosa',
          detail: 'El documento PDF ha sido descargado'
        });

        this.isDownloading.set(false);
      },
      error: (error) => {
        console.error('Error downloading document:', error);

        // Manejo de errores específicos
        let errorDetail = 'No se pudo descargar el documento';

        if (error.status === 404) {
          errorDetail = 'Documento no encontrado';
        } else if (error.status === 403) {
          errorDetail = 'No tiene permiso para descargar este documento';
        } else if (error.status === 500) {
          errorDetail = 'Error al generar el PDF. Por favor, inténtelo de nuevo';
        } else if (error.error?.detail) {
          errorDetail = error.error.detail;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error al descargar',
          detail: errorDetail
        });

        this.isDownloading.set(false);
      }
    });
  }

  /**
   * Eliminar documento con confirmación
   */
  deleteDocument(document: DocumentSummary): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar "${document.name}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.performDelete(document.id);
      }
    });
  }

  /**
   * Ejecutar eliminación
   */
  private performDelete(id: string): void {
    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Documento eliminado',
          detail: 'El documento ha sido eliminado exitosamente'
        });

        // Recargar lista
        this.loadDocuments();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.detail || 'No se pudo eliminar el documento'
        });

        console.error('Error deleting document:', error);
      }
    });
  }

  /**
   * Navegar a creación de documento
   */
  createDocument(): void {
    this.router.navigate(['/documents/create']);
  }

  /**
   * Reintentar carga después de error
   */
  retryLoad(): void {
    this.loadDocuments();
  }

  /**
   * Obtener severidad del tag según status
   */
  getStatusSeverity(status: DocumentStatus): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'borrador':
        return 'warn';
      case 'completado':
        return 'info';
      case 'notarizado':
        return 'success';
      default:
        return 'info';
    }
  }

  /**
   * Obtener label del status
   */
  getStatusLabel(status: DocumentStatus): string {
    switch (status) {
      case 'borrador':
        return 'Borrador';
      case 'completado':
        return 'Completado';
      case 'notarizado':
        return 'Notarizado';
      default:
        return status;
    }
  }

  /**
   * Obtener label legible del tipo de documento
   */
  getDocumentTypeLabel(type: DocumentType): string {
    const option = this.documentTypeOptions().find(opt => opt.value === type);
    return option ? option.label : type;
  }

  /**
   * Verificar si el botón editar está habilitado
   */
  canEdit(document: DocumentSummary): boolean {
    return document.status === 'borrador';
  }
}
