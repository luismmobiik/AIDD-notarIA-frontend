import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ProfileService, Profile, UpdateProfileRequest, ChangePasswordRequest } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

/**
 * Componente de gestión de perfil de usuario
 * SRP: Maneja presentación de perfil y delegación a ProfileService
 * Características:
 * - Visualización y edición de datos de perfil (nombre, email, teléfono)
 * - Cambio de contraseña con validación
 * - Dos formularios independientes para mantener separación de responsabilidades
 * - Estados de carga y error manejados con Signals
 * - 100% PrimeNG compliance
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    ToastModule,
    SkeletonModule,
    FloatLabelModule,
    HeaderComponent
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Signals para estado reactivo
  profileData = signal<Profile | null>(null);
  isEditingProfile = signal<boolean>(false);
  isLoadingProfile = signal<boolean>(true);
  isSavingProfile = signal<boolean>(false);
  isChangingPassword = signal<boolean>(false);

  // Signals para validez de formularios (para reactividad con computed)
  isProfileFormValid = signal<boolean>(false);
  isPasswordFormValid = signal<boolean>(false);

  // Computed signals
  currentUser = computed(() => this.authService.currentUser());

  canSaveProfile = computed(() => {
    const isValid = this.isProfileFormValid();
    const isEditing = this.isEditingProfile();
    const isSaving = this.isSavingProfile();
    const result = isValid && isEditing && !isSaving;
    this.errorHandler.logDebug('canSaveProfile', { isValid, isEditing, isSaving, result });
    return result;
  });

  canChangePassword = computed(() => {
    const isValid = this.isPasswordFormValid();
    const isChanging = this.isChangingPassword();
    const result = isValid && !isChanging;
    this.errorHandler.logDebug('canChangePassword', { isValid, isChanging, result });
    return result;
  });

  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandlerService);

  constructor() {
    // Effect para resetear formulario de contraseña después del éxito
    effect(() => {
      if (!this.isChangingPassword() && this.passwordForm) {
        // Este effect se ejecuta cuando isChangingPassword cambia de true a false
        // indicando que la operación terminó (éxito o error)
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadProfile();
    this.subscribeToFormChanges();
  }

  /**
   * Suscribirse a cambios de validez de formularios
   * Actualiza signals cuando la validez cambia para reactividad con computed signals
   */
  private subscribeToFormChanges(): void {
    // Suscribirse a cambios de validez del formulario de perfil
    this.profileForm.statusChanges.subscribe(() => {
      this.isProfileFormValid.set(this.profileForm.valid);
    });

    // Suscribirse a cambios de validez del formulario de contraseña
    this.passwordForm.statusChanges.subscribe(() => {
      this.isPasswordFormValid.set(this.passwordForm.valid);
    });

    // Inicializar valores actuales
    this.isProfileFormValid.set(this.profileForm.valid);
    this.isPasswordFormValid.set(this.passwordForm.valid);
  }

  /**
   * Inicializar formularios reactivos con validaciones
   * SRP: Configuración de formularios separada
   */
  private initializeForms(): void {
    // Formulario de perfil
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      email: [{ value: '', disabled: true }, [
        Validators.required,
        Validators.email
      ]],
      phone: [{ value: '', disabled: true }, [
        Validators.required,
        Validators.pattern(/^\d{10}$/)
      ]]
    });

    // Formulario de cambio de contraseña
    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      confirm_password: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('new_password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Cargar datos del perfil desde la API
   */
  private loadProfile(): void {
    this.isLoadingProfile.set(true);

    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profileData.set(profile);
        this.populateProfileForm(profile);
        this.isLoadingProfile.set(false);
      },
      error: (error) => {
        this.errorHandler.logError('Error loading user profile', error);
        this.isLoadingProfile.set(false);

        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar perfil',
          detail: 'No se pudo cargar la información del perfil. Por favor intenta de nuevo.',
          life: 5000
        });
      }
    });
  }

  /**
   * Poblar formulario de perfil con datos cargados
   */
  private populateProfileForm(profile: Profile): void {
    this.profileForm.patchValue({
      name: profile.name,
      email: profile.email,
      phone: profile.phone
    });
  }

  /**
   * Alternar modo de edición del perfil
   */
  toggleEditMode(): void {
    const isEditing = !this.isEditingProfile();
    this.isEditingProfile.set(isEditing);

    if (isEditing) {
      // Habilitar campos para edición
      this.profileForm.get('name')?.enable();
      this.profileForm.get('email')?.enable();
      this.profileForm.get('phone')?.enable();
    } else {
      // Cancelar edición: deshabilitar campos y restaurar valores originales
      this.profileForm.get('name')?.disable();
      this.profileForm.get('email')?.disable();
      this.profileForm.get('phone')?.disable();

      // Restaurar valores originales
      const profile = this.profileData();
      if (profile) {
        this.populateProfileForm(profile);
      }
    }
  }

  /**
   * Guardar cambios del perfil
   */
  saveProfile(): void {
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      return;
    }

    this.isSavingProfile.set(true);

    const updateData: UpdateProfileRequest = {
      name: this.profileForm.value.name,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profileData.set(updatedProfile);
        this.isSavingProfile.set(false);
        this.isEditingProfile.set(false);

        // Deshabilitar campos después de guardar
        this.profileForm.get('name')?.disable();
        this.profileForm.get('email')?.disable();
        this.profileForm.get('phone')?.disable();

        this.messageService.add({
          severity: 'success',
          summary: 'Perfil actualizado',
          detail: 'Los cambios se guardaron correctamente.',
          life: 5000
        });

        // Actualizar usuario en AuthService si es necesario
        const currentUser = this.currentUser();
        if (currentUser) {
          // Actualizar datos del usuario en el AuthService
          this.authService.currentUser.set({
            ...currentUser,
            name: updatedProfile.name,
            email: updatedProfile.email
          });
        }
      },
      error: (error) => {
        this.isSavingProfile.set(false);

        const errorDetail = error?.error?.detail || 'No se pudieron guardar los cambios. Por favor intenta de nuevo.';

        this.messageService.add({
          severity: 'error',
          summary: 'Error al actualizar perfil',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }

  /**
   * Cambiar contraseña
   */
  changePassword(): void {
    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid) {
      return;
    }

    this.isChangingPassword.set(true);

    const passwordData: ChangePasswordRequest = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password
    };

    this.profileService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.isChangingPassword.set(false);

        // Limpiar formulario de contraseña
        this.passwordForm.reset();
        this.passwordForm.markAsUntouched();

        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: response.message || 'Tu contraseña se cambió correctamente.',
          life: 5000
        });
      },
      error: (error) => {
        this.isChangingPassword.set(false);

        const errorDetail = error?.error?.detail || 'No se pudo cambiar la contraseña. Por favor verifica tu contraseña actual.';

        this.messageService.add({
          severity: 'error',
          summary: 'Error al cambiar contraseña',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }

  /**
   * Obtener mensaje de error para un campo específico del formulario de perfil
   */
  getProfileErrorMessage(fieldName: string): string {
    const control = this.profileForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'name':
        if (errors['required']) return 'El nombre es requerido';
        if (errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
        if (errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
        break;

      case 'email':
        if (errors['required']) return 'El email es requerido';
        if (errors['email']) return 'El email no es válido';
        break;

      case 'phone':
        if (errors['required']) return 'El teléfono es requerido';
        if (errors['pattern']) return 'El teléfono debe tener 10 dígitos';
        break;
    }

    return '';
  }

  /**
   * Obtener mensaje de error para un campo específico del formulario de contraseña
   */
  getPasswordErrorMessage(fieldName: string): string {
    const control = this.passwordForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'current_password':
        if (errors['required']) return 'La contraseña actual es requerida';
        break;

      case 'new_password':
        if (errors['required']) return 'La nueva contraseña es requerida';
        if (errors['minlength']) return 'La contraseña debe tener al menos 8 caracteres';
        break;

      case 'confirm_password':
        if (errors['required']) return 'Debes confirmar la nueva contraseña';
        break;
    }

    // Error de coincidencia de contraseñas (a nivel de formulario)
    if (fieldName === 'confirm_password' && this.passwordForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  /**
   * Verificar si un campo del formulario de perfil tiene errores
   */
  hasProfileError(fieldName: string): boolean {
    const control = this.profileForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Verificar si un campo del formulario de contraseña tiene errores
   */
  hasPasswordError(fieldName: string): boolean {
    const control = this.passwordForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Navegar a una ruta específica
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
