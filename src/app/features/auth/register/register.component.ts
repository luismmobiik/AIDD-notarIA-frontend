import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';

/**
 * Componente de registro de usuario
 * Implementa formulario reactivo con validación completa
 * Cumple con SRP: Solo maneja presentación y delegación a servicios
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    ToastModule,
    AvatarModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  // Signals para estado reactivo
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Computed signal para verificar si el formulario es válido y no está enviándose
  canSubmit = computed(() => this.registerForm?.valid && !this.isSubmitting());

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Inicializar formulario reactivo con validaciones
   * SRP: Configuración de formulario separada
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', [
        Validators.required,
        this.mexicanPhoneValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador personalizado para formato de teléfono mexicano
   * Acepta formatos: +52 55 1234 5678, +5255123456 78, 5512345678
   */
  private mexicanPhoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const phoneRegex = /^(\+52\s?)?(\d{2}\s?\d{4}\s?\d{4}|\d{10})$/;
    const valid = phoneRegex.test(control.value);

    return valid ? null : { invalidPhone: true };
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Obtener mensaje de error para un campo específico
   * SRP: Lógica de mensajes de error centralizada
   */
  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    // Mensajes de error en español
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
        if (errors['invalidPhone']) return 'El teléfono debe tener formato válido (+52 55 1234 5678)';
        break;

      case 'password':
        if (errors['required']) return 'La contraseña es requerida';
        if (errors['minlength']) return 'La contraseña debe tener al menos 8 caracteres';
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Debes confirmar la contraseña';
        break;
    }

    // Error de coincidencia de contraseñas (a nivel de formulario)
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Manejar envío del formulario
   * DIP: Depende de AuthService (abstracción) no de implementación HTTP
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const registerData: RegisterRequest = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
      password: this.registerForm.value.password
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);

        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta creada exitosamente',
          detail: 'Por favor inicia sesión con tus credenciales',
          life: 5000
        });

        // Navegar a login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting.set(false);

        // Extraer mensaje de error del backend
        const errorDetail = error?.error?.detail || 'Error al crear la cuenta. Por favor intenta de nuevo.';
        this.errorMessage.set(errorDetail);

        // Mostrar toast de error
        this.messageService.add({
          severity: 'error',
          summary: 'Error en el registro',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }
}
