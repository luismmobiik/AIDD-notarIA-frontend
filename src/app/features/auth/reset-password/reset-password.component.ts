import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente de restablecimiento de contraseña
 * Implementa formulario reactivo para establecer nueva contraseña con token
 * Cumple con SRP: Solo maneja presentación y delegación a servicios
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    PasswordModule,
    CardModule,
    MessageModule,
    ToastModule,
    AvatarModule
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;

  // Signals para estado reactivo
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  token = signal<string>('');

  // Computed signal para verificar si el formulario es válido y no está cargando
  canSubmit = computed(() => this.resetPasswordForm?.valid && !this.isLoading());

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    // Extraer token de los parámetros de ruta
    const tokenParam = this.route.snapshot.paramMap.get('token');
    if (!tokenParam) {
      this.errorMessage.set('Token de recuperación no válido');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Token de recuperación no válido',
        life: 5000
      });
    } else {
      this.token.set(tokenParam);
    }

    this.initializeForm();
  }

  /**
   * Inicializar formulario reactivo con validaciones
   * SRP: Configuración de formulario separada
   */
  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   * OCP: Validador reutilizable y extensible
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Limpiar error de mismatch si las contraseñas coinciden
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  /**
   * Obtener mensaje de error para un campo específico
   * SRP: Lógica de mensajes de error centralizada
   */
  getErrorMessage(fieldName: string): string {
    const control = this.resetPasswordForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'password':
        if (errors['required']) return 'La contraseña es requerida';
        if (errors['minlength']) return 'La contraseña debe tener al menos 8 caracteres';
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Debes confirmar la contraseña';
        if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
        break;
    }

    return '';
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const control = this.resetPasswordForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Manejar envío del formulario
   * DIP: Depende de AuthService (abstracción) no de implementación HTTP
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.resetPasswordForm.markAllAsTouched();

    if (this.resetPasswordForm.invalid) {
      return;
    }

    if (!this.token()) {
      this.errorMessage.set('Token de recuperación no válido');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const newPassword = this.resetPasswordForm.value.password;

    this.authService.resetPassword(this.token(), newPassword).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'Tu contraseña ha sido restablecida exitosamente. Redirigiendo al login...',
          life: 3000
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Extraer mensaje de error del backend
        const errorDetail = error?.error?.detail || 'Token inválido o expirado. Por favor solicita un nuevo enlace de recuperación.';
        this.errorMessage.set(errorDetail);

        // Mostrar toast de error
        this.messageService.add({
          severity: 'error',
          summary: 'Error al restablecer contraseña',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }

  /**
   * Navegar al login
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
