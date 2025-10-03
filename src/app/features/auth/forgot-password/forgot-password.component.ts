import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente de solicitud de recuperación de contraseña
 * Implementa formulario reactivo para solicitar enlace de recuperación
 * Cumple con SRP: Solo maneja presentación y delegación a servicios
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    MessageModule,
    ToastModule,
    AvatarModule
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;

  // Signals para estado reactivo
  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');

  // Computed signal para verificar si el formulario es válido y no está cargando
  canSubmit = computed(() => this.forgotPasswordForm?.valid && !this.isLoading());

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
    this.forgotPasswordForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  /**
   * Obtener mensaje de error para el campo email
   * SRP: Lógica de mensajes de error centralizada
   */
  getErrorMessage(fieldName: string): string {
    const control = this.forgotPasswordForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (fieldName === 'email') {
      if (errors['required']) return 'El email es requerido';
      if (errors['email']) return 'El email no es válido';
    }

    return '';
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Manejar envío del formulario
   * DIP: Depende de AuthService (abstracción) no de implementación HTTP
   * Siempre muestra mensaje de éxito por seguridad (no revela si email existe)
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set('');

    const email = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Mensaje genérico de éxito (no revela si el email existe)
        const successMsg = 'Si el email existe, recibirás un enlace de recuperación';
        this.successMessage.set(successMsg);

        // Mostrar toast de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud enviada',
          detail: successMsg,
          life: 5000
        });

        // Limpiar formulario
        this.forgotPasswordForm.reset();
      },
      error: (error) => {
        this.isLoading.set(false);

        // Incluso en error, mostrar mensaje genérico por seguridad
        const successMsg = 'Si el email existe, recibirás un enlace de recuperación';
        this.successMessage.set(successMsg);

        // Mostrar toast de éxito (no revelar errores)
        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud enviada',
          detail: successMsg,
          life: 5000
        });

        // Limpiar formulario
        this.forgotPasswordForm.reset();
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
