import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { PanelModule } from 'primeng/panel';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DocumentService } from '../../../core/services/document.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import {
  DocumentType,
  DocumentTypeOption,
  CreateDocumentRequest,
  Document,
  UpdateDocumentRequest
} from '../../../core/models/document.model';

/**
 * CreateDocumentComponent - Formulario multi-paso para crear/editar documentos
 *
 * US-011: Create New Document (Create Mode)
 * US-012: Edit Existing Document (Edit Mode)
 *
 * SRP: Maneja únicamente la UI del formulario de creación/edición de documentos
 * El DocumentService encapsula toda la lógica de API
 *
 * Características:
 * - 100% Angular 20+ compliance: Signals, inject(), modern control flow
 * - 100% PrimeNG v20: p-stepper, p-select, p-inputtext, p-textarea, p-button, p-panel
 * - Reactive Forms con validación completa
 * - Multi-step form con 4 pasos
 * - Preview antes de guardar
 * - Mensajes de error en español
 * - Loading states y error handling
 * - Navegación al listado después de crear/actualizar
 * - Modo edición: detecta ID de ruta, carga documento, pre-puebla formulario
 * - Modo edición: deshabilita selector de tipo, cambia labels y endpoints
 */
@Component({
  selector: 'app-create-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    CardModule,
    ButtonModule,
    StepperModule,
    SelectModule,
    InputTextModule,
    Textarea,
    PanelModule,
    MessageModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './create-document.component.html',
  styleUrl: './create-document.component.scss'
})
export class CreateDocumentComponent implements OnInit {
  // Dependency injection con inject()
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);

  // Signals para gestión de estado reactivo
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  activeStepIndex = signal<number | undefined>(0);

  // Edit mode signals
  documentId = signal<string | null>(null);
  isEditMode = computed(() => this.documentId() !== null);

  // Página de título dinámico
  pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Documento' : 'Crear Nuevo Documento'
  );
  pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifique los campos que desee actualizar'
      : 'Complete el formulario para crear su documento'
  );
  submitButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar Documento' : 'Guardar como Borrador'
  );

  // Opciones de tipos de documentos
  documentTypes: DocumentTypeOption[] = [
    { label: 'Contrato de Compraventa', value: 'contrato_compraventa' },
    { label: 'Contrato de Arrendamiento', value: 'contrato_arrendamiento' },
    { label: 'Contrato de Servicios', value: 'contrato_servicios' },
    { label: 'Escritura de Propiedad', value: 'escritura_propiedad' },
    { label: 'Escritura de Empresa', value: 'escritura_empresa' },
    { label: 'Testamento', value: 'testamento' },
    { label: 'Poder Notarial', value: 'poder_notarial' },
    { label: 'Acta Constitutiva', value: 'acta_constitutiva' }
  ];

  // Reactive Forms
  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;

  // Signals para validación reactiva
  step1Valid = signal<boolean>(false);
  step2Valid = signal<boolean>(false);

  // Computed signals
  canProceedFromStep1 = computed(() => this.step1Valid());
  canProceedFromStep2 = computed(() => this.step2Valid());
  canSubmit = computed(() => {
    // Solo permitir guardar si todos los formularios son válidos y no está cargando
    return this.step1Valid() && this.step2Valid() && !this.isLoading();
  });

  ngOnInit(): void {
    this.initializeForms();

    // Check if we're in edit mode (route has :id parameter)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.documentId.set(id);
      this.loadDocument(id);
    }
  }

  /**
   * Cargar documento existente para edición (US-012)
   */
  private loadDocument(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.documentService.getDocument(id).subscribe({
      next: (document) => {
        // Verificar que el documento sea editable (status = borrador)
        if (document.status !== 'borrador') {
          this.messageService.add({
            severity: 'error',
            summary: 'No se puede editar',
            detail: 'Solo se pueden editar documentos en estado borrador'
          });
          this.router.navigate(['/documents']);
          return;
        }

        this.populateForm(document);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorHandler.logError('Error loading document', error);

        let errorMsg = 'No se pudo cargar el documento';
        if (error.status === 404) {
          errorMsg = 'Documento no encontrado';
        } else if (error.status === 403) {
          errorMsg = 'No tiene permisos para editar este documento';
        } else if (error.error?.detail) {
          errorMsg = error.error.detail;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg
        });

        // Redirigir a la lista de documentos después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/documents']);
        }, 2000);
      }
    });
  }

  /**
   * Poblar formularios con datos del documento (US-012)
   */
  private populateForm(document: Document): void {
    // Paso 1: Tipo y nombre
    this.step1Form.patchValue({
      documentType: document.type,
      documentName: document.name
    });

    // Paso 2: Partes involucradas
    if (document.parties && Object.keys(document.parties).length > 0) {
      // Limpiar array existente
      this.partiesArray.clear();

      // Agregar partes del documento
      Object.values(document.parties).forEach((party: any) => {
        const partyGroup = this.fb.group({
          name: [party.name || '', [Validators.required, Validators.minLength(2)]],
          id: [party.id || '', [Validators.required]],
          address: [party.address || '', [Validators.required]]
        });
        this.partiesArray.push(partyGroup);
      });
    }

    // Paso 3: Términos y contenido adicional
    if (document.terms && Object.keys(document.terms).length > 0) {
      // Limpiar array existente
      this.termsArray.clear();

      // Agregar términos del documento
      Object.entries(document.terms).forEach(([key, value]) => {
        const termGroup = this.fb.group({
          key: [key, [Validators.required]],
          value: [value, [Validators.required]]
        });
        this.termsArray.push(termGroup);
      });
    }

    // Contenido adicional
    if (document.content && document.content['additional_notes']) {
      this.step3Form.patchValue({
        additionalContent: document.content['additional_notes']
      });
    }

    // Actualizar validación
    this.step1Valid.set(this.step1Form.valid);
    this.step2Valid.set(this.step2Form.valid);
  }

  /**
   * Inicializar formularios reactivos
   */
  private initializeForms(): void {
    // Paso 1: Tipo de documento y nombre
    this.step1Form = this.fb.group({
      documentType: ['', [Validators.required]],
      documentName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]]
    });

    // Paso 2: Partes involucradas (mínimo 1 parte)
    this.step2Form = this.fb.group({
      parties: this.fb.array([this.createPartyFormGroup()])
    });

    // Paso 3: Términos y condiciones
    this.step3Form = this.fb.group({
      terms: this.fb.array([this.createTermFormGroup()]),
      additionalContent: ['']
    });

    // Suscribirse a cambios de formularios para actualizar signals
    this.step1Form.statusChanges.subscribe(() => {
      this.step1Valid.set(this.step1Form.valid);
    });

    this.step2Form.statusChanges.subscribe(() => {
      this.step2Valid.set(this.step2Form.valid);
    });

    // Inicializar validación
    this.step1Valid.set(this.step1Form.valid);
    this.step2Valid.set(this.step2Form.valid);
  }

  /**
   * Crear FormGroup para una parte involucrada
   */
  private createPartyFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      id: ['', [Validators.required]],
      address: ['', [Validators.required]]
    });
  }

  /**
   * Crear FormGroup para un término
   */
  private createTermFormGroup(): FormGroup {
    return this.fb.group({
      key: ['', [Validators.required]],
      value: ['', [Validators.required]]
    });
  }

  /**
   * Getter para FormArray de partes
   */
  get partiesArray(): FormArray {
    return this.step2Form.get('parties') as FormArray;
  }

  /**
   * Getter para FormArray de términos
   */
  get termsArray(): FormArray {
    return this.step3Form.get('terms') as FormArray;
  }

  /**
   * Agregar nueva parte involucrada
   */
  addParty(): void {
    this.partiesArray.push(this.createPartyFormGroup());
  }

  /**
   * Eliminar parte involucrada
   */
  removeParty(index: number): void {
    if (this.partiesArray.length > 1) {
      this.partiesArray.removeAt(index);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe haber al menos una parte involucrada'
      });
    }
  }

  /**
   * Agregar nuevo término
   */
  addTerm(): void {
    this.termsArray.push(this.createTermFormGroup());
  }

  /**
   * Eliminar término
   */
  removeTerm(index: number): void {
    if (this.termsArray.length > 0) {
      this.termsArray.removeAt(index);
    }
  }

  /**
   * Obtener etiqueta del tipo de documento seleccionado
   */
  getDocumentTypeLabel(): string {
    const selectedType = this.step1Form.get('documentType')?.value;
    const option = this.documentTypes.find(t => t.value === selectedType);
    return option?.label || '';
  }

  /**
   * Validar y avanzar al siguiente paso
   */
  nextStep(): void {
    const currentStep = this.activeStepIndex() ?? 0;

    if (currentStep === 0 && !this.step1Form.valid) {
      this.markFormGroupTouched(this.step1Form);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    if (currentStep === 1 && !this.step2Form.valid) {
      this.markFormGroupTouched(this.step2Form);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete la información de todas las partes'
      });
      return;
    }

    this.activeStepIndex.set(currentStep + 1);
  }

  /**
   * Retroceder al paso anterior
   */
  previousStep(): void {
    const currentStep = this.activeStepIndex() ?? 0;
    if (currentStep > 0) {
      this.activeStepIndex.set(currentStep - 1);
    }
  }

  /**
   * Marcar todos los campos del formulario como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  /**
   * Verificar si un campo tiene error y está touched
   */
  hasError(form: FormGroup, fieldName: string, errorType?: string): boolean {
    const field = form.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.touched && field.hasError(errorType);
    }
    return field.touched && field.invalid;
  }

  /**
   * Verificar si un campo de una parte tiene error
   */
  hasPartyError(index: number, fieldName: string): boolean {
    const party = this.partiesArray.at(index) as FormGroup;
    return this.hasError(party, fieldName);
  }

  /**
   * Verificar si un campo de un término tiene error
   */
  hasTermError(index: number, fieldName: string): boolean {
    const term = this.termsArray.at(index) as FormGroup;
    return this.hasError(term, fieldName);
  }

  /**
   * Guardar documento como borrador (crear o actualizar según modo)
   * US-011: POST /api/documents (Create mode)
   * US-012: PUT /api/documents/:id (Edit mode)
   */
  async saveDocument(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // Construir objeto de partes
      const partiesObj: Record<string, any> = {};
      this.partiesArray.controls.forEach((control, index) => {
        const party = control.value;
        partiesObj[`party_${index + 1}`] = {
          name: party.name,
          id: party.id,
          address: party.address
        };
      });

      // Construir objeto de términos
      const termsObj: Record<string, any> = {};
      this.termsArray.controls.forEach(control => {
        const term = control.value;
        if (term.key && term.value) {
          termsObj[term.key] = term.value;
        }
      });

      // Construir contenido adicional si existe
      const additionalContent = this.step3Form.get('additionalContent')?.value;
      const contentObj: Record<string, any> = {};
      if (additionalContent) {
        contentObj['additional_notes'] = additionalContent;
      }

      // Decidir si crear o actualizar
      if (this.isEditMode()) {
        // Modo edición: PUT /api/documents/:id
        const updateRequest: UpdateDocumentRequest = {
          name: this.step1Form.get('documentName')?.value,
          content: Object.keys(contentObj).length > 0 ? contentObj : undefined,
          parties: Object.keys(partiesObj).length > 0 ? partiesObj : undefined,
          terms: Object.keys(termsObj).length > 0 ? termsObj : undefined
        };

        this.documentService.updateDocument(this.documentId()!, updateRequest).subscribe({
          next: (response) => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Documento actualizado exitosamente'
            });

            // Navegar al listado de documentos después de 1 segundo
            setTimeout(() => {
              this.router.navigate(['/documents']);
            }, 1000);
          },
          error: (error) => {
            this.handleSaveError(error, 'actualizar');
          }
        });
      } else {
        // Modo creación: POST /api/documents
        const createRequest: CreateDocumentRequest = {
          name: this.step1Form.get('documentName')?.value,
          type: this.step1Form.get('documentType')?.value as DocumentType,
          content: Object.keys(contentObj).length > 0 ? contentObj : undefined,
          parties: Object.keys(partiesObj).length > 0 ? partiesObj : undefined,
          terms: Object.keys(termsObj).length > 0 ? termsObj : undefined
        };

        this.documentService.createDocument(createRequest).subscribe({
          next: (response) => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Documento creado como borrador exitosamente'
            });

            // Navegar al listado de documentos después de 1 segundo
            setTimeout(() => {
              this.router.navigate(['/documents']);
            }, 1000);
          },
          error: (error) => {
            this.handleSaveError(error, 'crear');
          }
        });
      }
    } catch (error) {
      this.isLoading.set(false);
      const action = this.isEditMode() ? 'actualizar' : 'crear';
      this.errorMessage.set(`Error inesperado al ${action} el documento`);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error inesperado al ${action} el documento`
      });
    }
  }

  /**
   * Manejar errores de guardado (DRY principle)
   */
  private handleSaveError(error: any, action: 'crear' | 'actualizar'): void {
    this.isLoading.set(false);
    this.errorHandler.logError(`Error ${action} documento`, error);

    // Extraer mensaje de error apropiado
    let errorMsg = `Error al ${action} el documento`;
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMsg = error.error;
      } else if (error.error.detail) {
        if (typeof error.error.detail === 'string') {
          errorMsg = error.error.detail;
        } else if (Array.isArray(error.error.detail)) {
          errorMsg = error.error.detail.map((d: any) => d.msg || d).join(', ');
        }
      } else if (error.error.message) {
        errorMsg = error.error.message;
      }
    } else if (error.message) {
      errorMsg = error.message;
    }

    this.errorMessage.set(errorMsg);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMsg
    });
  }

  /**
   * Cancelar y volver al listado de documentos
   */
  cancel(): void {
    this.router.navigate(['/documents']);
  }
}
