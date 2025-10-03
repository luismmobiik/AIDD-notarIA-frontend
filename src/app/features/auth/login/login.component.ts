import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.model';

/**
 * Componente de inicio de sesión
 * Implementa formulario reactivo con validación y autenticación
 * Cumple con SRP: Solo maneja presentación y delegación a servicios
 */
@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  // Signals para estado reactivo
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Computed signal para verificar si el formulario es válido y no está cargando
  canSubmit = computed(() => this.loginForm?.valid && !this.isLoading());

  // URL de retorno después del login
  private returnUrl: string = '/dashboard';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    this.initializeForm();

    // Obtener returnUrl de los query params si existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  /**
   * Inicializar formulario reactivo con validaciones
   * SRP: Configuración de formulario separada
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(1)
      ]]
    });
  }

  /**
   * Obtener mensaje de error para un campo específico
   * SRP: Lógica de mensajes de error centralizada
   */
  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'email':
        if (errors['required']) return 'El email es requerido';
        if (errors['email']) return 'El email no es válido';
        break;

      case 'password':
        if (errors['required']) return 'La contraseña es requerida';
        if (errors['minlength']) return 'La contraseña es requerida';
        break;
    }

    return '';
  }

  /**
   * Verificar si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Manejar envío del formulario
   * DIP: Depende de AuthService (abstracción) no de implementación HTTP
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Inicio de sesión exitoso',
          detail: `Bienvenido, ${response.user.name}`,
          life: 3000
        });

        // Navegar a la URL de retorno o dashboard después de 1 segundo
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Extraer mensaje de error del backend
        const errorDetail = error?.error?.detail || 'Error al iniciar sesión. Por favor verifica tus credenciales.';
        this.errorMessage.set(errorDetail);

        // Mostrar toast de error
        this.messageService.add({
          severity: 'error',
          summary: 'Error en el inicio de sesión',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }
}
