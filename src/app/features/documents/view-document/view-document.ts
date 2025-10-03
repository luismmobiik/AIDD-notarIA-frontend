import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// Services and Models
import { DocumentService } from '../../../core/services/document.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { Document, DocumentStatus, DocumentParty, DocumentTerm } from '../../../core/models/document.model';
import { HeaderComponent } from '../../../shared/components/header/header.component';

/**
 * ViewDocumentComponent - Visualización de detalles de documento
 *
 * US-011: View Document Details
 *
 * Características:
 * - 100% Angular 20+ compliance (Signals, inject(), modern control flow)
 * - 100% PrimeNG v20 compliance (p-card, p-panel, p-button, p-tag)
 * - Carga documento por ID desde ruta
 * - Muestra toda la información en formato readonly
 * - Badge de estado con colores según status
 * - Botones de acción: Volver, Editar, Descargar, Eliminar
 * - Loading state con spinner
 * - Error handling con mensajes en español
 * - Responsive design mobile-first
 *
 * SRP: Solo se encarga de visualizar detalles del documento
 */
@Component({
  selector: 'app-view-document',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CardModule,
    PanelModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    HeaderComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './view-document.html',
  styleUrl: './view-document.scss'
})
export class ViewDocumentComponent implements OnInit {
  // Dependency injection con inject() - Angular 20+ pattern
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorHandler = inject(ErrorHandlerService);

  // Signals para estado reactivo
  document = signal<Document | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  documentId = signal<string | null>(null);
  isDownloading = signal<boolean>(false);
  isNotarizing = signal<boolean>(false);
  isCompleting = signal<boolean>(false);

  // Computed signals para estado derivado
  documentName = computed(() => this.document()?.name || 'Sin nombre');
  documentType = computed(() => this.getDocumentTypeLabel(this.document()?.type || ''));
  documentStatus = computed(() => this.document()?.status || 'borrador');
  createdAt = computed(() => this.document()?.created_at || '');
  updatedAt = computed(() => this.document()?.updated_at || '');
  notarizedAt = computed(() => this.document()?.notarized_at || null);

  // Computed para botones condicionales
  canEdit = computed(() => this.documentStatus() === 'borrador');
  canComplete = computed(() => this.documentStatus() === 'borrador');
  isNotarized = computed(() => this.documentStatus() === 'notarizado');
  canNotarize = computed(() => this.documentStatus() === 'completado');

  // Computed para parties y terms como arrays
  partiesArray = computed(() => {
    const doc = this.document();
    if (!doc?.parties) return [];

    // Convertir objeto parties a array
    if (Array.isArray(doc.parties)) {
      return doc.parties as DocumentParty[];
    }

    // Si es objeto, intentar extraer valores
    return Object.values(doc.parties) as DocumentParty[];
  });

  termsArray = computed(() => {
    const doc = this.document();
    if (!doc?.terms) return [];

    // Convertir objeto terms a array de key-value
    if (Array.isArray(doc.terms)) {
      return doc.terms as DocumentTerm[];
    }

    // Si es objeto, convertir a array de key-value
    return Object.entries(doc.terms).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  });

  ngOnInit(): void {
    // Obtener ID del documento de la ruta
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage.set('ID de documento no proporcionado');
      return;
    }

    this.documentId.set(id);
    this.loadDocument(id);
  }

  /**
   * Cargar documento desde API
   */
  private loadDocument(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.documentService.getDocument(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Manejo de errores con mensajes en español
        if (error.status === 404) {
          this.errorMessage.set('Documento no encontrado');
        } else if (error.status === 403) {
          this.errorMessage.set('No tiene permiso para ver este documento');
        } else {
          this.errorMessage.set('Error al cargar el documento. Por favor, inténtelo de nuevo.');
        }

        this.errorHandler.logError('Error loading document', error);
      }
    });
  }

  /**
   * Navegar de vuelta a lista de documentos
   */
  goBack(): void {
    this.router.navigate(['/documents']);
  }

  /**
   * Navegar a edición de documento
   */
  editDocument(): void {
    const id = this.documentId();
    if (id) {
      this.router.navigate(['/documents/edit', id]);
    }
  }

  /**
   * Descargar documento como PDF
   */
  downloadDocument(): void {
    const docId = this.documentId();

    if (!docId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el documento'
      });
      return;
    }

    // Mostrar estado de carga
    this.isDownloading.set(true);

    this.documentService.downloadDocument(docId).subscribe({
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
        this.errorHandler.logError('Error downloading document', error);

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
  deleteDocument(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.performDelete();
      }
    });
  }

  /**
   * Ejecutar eliminación
   */
  private performDelete(): void {
    const id = this.documentId();
    if (!id) return;

    this.isLoading.set(true);

    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Documento eliminado',
          detail: 'El documento ha sido eliminado exitosamente'
        });

        // Redirigir a lista después de 1 segundo
        setTimeout(() => {
          this.router.navigate(['/documents']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.detail || 'No se pudo eliminar el documento'
        });

        this.errorHandler.logError('Error deleting document', error);
      }
    });
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
  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'contrato_compraventa': 'Contrato de Compraventa',
      'contrato_arrendamiento': 'Contrato de Arrendamiento',
      'contrato_servicios': 'Contrato de Servicios',
      'escritura_propiedad': 'Escritura de Propiedad',
      'escritura_empresa': 'Escritura de Empresa',
      'testamento': 'Testamento',
      'poder_notarial': 'Poder Notarial',
      'acta_constitutiva': 'Acta Constitutiva'
    };

    return labels[type] || type;
  }

  /**
   * Marcar documento como completado
   * US-016: Mark Document as Complete
   *
   * Solo disponible para documentos con status='borrador'
   * Muestra confirmation dialog con advertencia sobre pérdida de editabilidad
   * Una vez completado, el documento no puede ser editado pero sí notarizado
   */
  completeDocument(): void {
    const docId = this.documentId();

    if (!docId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el documento'
      });
      return;
    }

    const doc = this.document();
    const documentId = docId; // Capture ID in a non-nullable variable

    // Mostrar diálogo de confirmación con advertencia sobre editabilidad
    this.confirmationService.confirm({
      message: `¿Está seguro de marcar el documento "${doc?.name}" como completado?\n\n` +
               `⚠️ Una vez completado, no podrá editar el documento. ` +
               `Sin embargo, podrá solicitar su notarización.`,
      header: 'Confirmar Completar Documento',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, marcar como completado',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-info',
      accept: () => {
        this.performComplete(documentId);
      }
    });
  }

  /**
   * Ejecutar llamada a API para completar documento
   * @private
   */
  private performComplete(documentId: string): void {
    this.isCompleting.set(true);

    this.documentService.completeDocument(documentId).subscribe({
      next: (updatedDoc) => {
        // Actualizar estado local del documento
        this.document.set(updatedDoc);

        this.messageService.add({
          severity: 'success',
          summary: 'Documento completado',
          detail: 'El documento ha sido marcado como completado. Ya puede solicitar su notarización.'
        });

        this.isCompleting.set(false);
      },
      error: (error) => {
        this.errorHandler.logError('Error completing document', error);

        // Manejo de errores específicos con mensajes en español
        let errorDetail = 'No se pudo completar el documento';

        if (error.status === 400) {
          errorDetail = error.error?.detail || 'Solo se pueden completar documentos en estado borrador';
        } else if (error.status === 403) {
          errorDetail = 'No tiene permiso para completar este documento';
        } else if (error.status === 404) {
          errorDetail = 'Documento no encontrado';
        } else if (error.error?.detail) {
          errorDetail = error.error.detail;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error al completar',
          detail: errorDetail
        });

        this.isCompleting.set(false);
      }
    });
  }

  /**
   * Solicitar notarización del documento (MOCK)
   * US-015: Request Document Notarization - Mock
   *
   * Solo disponible para documentos con status='completado'
   * Muestra confirmation dialog con disclaimer de MOCK
   */
  notarizeDocument(): void {
    const docId = this.documentId();

    if (!docId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el documento'
      });
      return;
    }

    const doc = this.document();
    const documentId = docId; // Capture ID in a non-nullable variable

    // Mostrar diálogo de confirmación con MOCK disclaimer
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea solicitar la notarización del documento "${doc?.name}"?\n\n` +
               `NOTA: Esta es una función de demostración. No se contactará a ningún notario real. ` +
               `El documento simplemente cambiará su estado a "Notarizado".`,
      header: 'Confirmar Notarización (Demo)',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sí, notarizar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.performNotarization(documentId);
      }
    });
  }

  /**
   * Ejecutar llamada a API de notarización
   * @private
   */
  private performNotarization(documentId: string): void {
    this.isNotarizing.set(true);

    this.documentService.notarizeDocument(documentId).subscribe({
      next: (updatedDoc) => {
        // Actualizar estado local del documento
        this.document.set(updatedDoc);

        this.messageService.add({
          severity: 'success',
          summary: 'Notarización exitosa',
          detail: 'El documento ha sido notarizado correctamente (modo demostración)'
        });

        this.isNotarizing.set(false);
      },
      error: (error) => {
        this.errorHandler.logError('Error notarizing document', error);

        // Manejo de errores específicos con mensajes en español
        let errorDetail = 'No se pudo notarizar el documento';

        if (error.status === 400) {
          errorDetail = error.error?.detail || 'Solo se pueden notarizar documentos completados';
        } else if (error.status === 403) {
          errorDetail = 'No tiene permiso para notarizar este documento';
        } else if (error.status === 404) {
          errorDetail = 'Documento no encontrado';
        } else if (error.error?.detail) {
          errorDetail = error.error.detail;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error al notarizar',
          detail: errorDetail
        });

        this.isNotarizing.set(false);
      }
    });
  }
}
