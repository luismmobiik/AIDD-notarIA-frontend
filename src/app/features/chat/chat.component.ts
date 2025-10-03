import { Component, signal, computed, inject, effect, OnInit, OnDestroy, viewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MarkdownModule } from 'ngx-markdown';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ChatMessage } from '../../core/models/chat.model';

/**
 * ChatComponent - Interfaz de chat con asesor legal IA
 *
 * SRP: Maneja únicamente la UI del chat y la interacción con el usuario
 * El ChatService encapsula toda la lógica de API y Chrome AI
 *
 * Características:
 * - 100% Signals para gestión de estado reactivo
 * - Integración con Chrome AI Prompt API con sesión reutilizable (optimización de rendimiento)
 * - Persistencia de conversaciones en backend
 * - Auto-scroll a mensajes nuevos
 * - Loading states y error handling
 * - Diseño responsive con PrimeNG
 * - Session warmup para respuesta instantánea en primer mensaje
 * - Limpieza de sesión en ngOnDestroy para liberar recursos
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    CardModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    MessageModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    MarkdownModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Dependency injection
  private chatService = inject(ChatService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  // ViewChild para auto-scroll (using Angular 20+ viewChild signal)
  private messagesContainer = viewChild<ElementRef>('messagesContainer');
  private shouldScrollToBottom = false;

  // Signals para gestión de estado reactivo
  messages = signal<ChatMessage[]>([]);
  sessionId = signal<string>('');
  isLoadingHistory = signal<boolean>(false);
  isSending = signal<boolean>(false);
  chromeAiAvailable = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Signal for user input with getter/setter for ngModel compatibility
  userInput = signal<string>('');

  // Computed signals
  canSendMessage = computed(() => {
    return this.userInput().trim().length > 0 &&
           !this.isSending() &&
           this.chromeAiAvailable();
  });

  hasMessages = computed(() => this.messages().length > 0);

  /**
   * Inicialización del componente
   * Verifica disponibilidad de Chrome AI y carga historial SOLO si está autenticado
   * Optimización: Pre-calienta sesión de Chrome AI para respuesta instantánea
   */
  async ngOnInit(): Promise<void> {
    // Add chat-route class to body to disable page-level scrolling
    document.body.classList.add('chat-route');

    // Verificación sincrónica inicial de Chrome AI
    const basicCheck = this.chatService.isChromeAiAvailable();
    this.chromeAiAvailable.set(basicCheck);

    // Verificación asíncrona completa de Chrome AI
    if (basicCheck) {
      try {
        const availabilityResult = await this.chatService.checkChromeAiAvailability();

        if (availabilityResult.available) {
          this.chromeAiAvailable.set(true);
          this.errorMessage.set('');
          this.errorHandler.logDebug('Chrome AI is ready', availabilityResult.status);

          // 🔥 OPTIMIZACIÓN: Pre-calentar sesión para respuesta instantánea en primer mensaje
          // Esto crea la sesión de Chrome AI por adelantado, eliminando el delay del primer mensaje
          await this.chatService.warmupSession();
        } else if (availabilityResult.canDownload) {
          this.chromeAiAvailable.set(false);
          this.errorMessage.set(
            'Chrome AI necesita descargar el modelo. Por favor, espera unos minutos e intenta enviar un mensaje para iniciar la descarga.'
          );
          this.messageService.add({
            severity: 'info',
            summary: 'Descarga necesaria',
            detail: availabilityResult.status,
            life: 6000
          });
        } else {
          this.chromeAiAvailable.set(false);
          this.errorMessage.set(availabilityResult.status);
        }
      } catch (error) {
        this.errorHandler.logError('Error checking Chrome AI availability', error);
        this.chromeAiAvailable.set(false);
        this.errorMessage.set(
          'Error verificando Chrome AI. Verifica que las flags estén habilitadas en chrome://flags'
        );
      }
    } else {
      this.errorMessage.set(
        'La API de Chrome AI no está disponible en este navegador. Por favor, usa Chrome Canary con las flags habilitadas:\n\n' +
        '1. chrome://flags/#prompt-api-for-gemini-nano\n' +
        '2. chrome://flags/#optimization-guide-on-device-model\n\n' +
        'Reinicia Chrome Canary después de habilitar las flags.'
      );
    }

    // IMPORTANTE: Solo cargar historial si el usuario está autenticado
    // AuthService ya verificó el token en su constructor
    if (this.authService.isAuthenticated()) {
      this.loadHistory();
    } else {
      this.errorHandler.logWarning('User not authenticated, skipping chat history load');
    }
  }

  /**
   * Limpieza del componente
   * Destruye sesión de Chrome AI para liberar recursos
   */
  ngOnDestroy(): void {
    this.errorHandler.logDebug('ChatComponent destroying, cleaning up Chrome AI session');

    // Remove chat-route class from body to restore normal scrolling
    document.body.classList.remove('chat-route');

    this.chatService.destroySession();
  }

  /**
   * Hook para auto-scroll después de actualizar la vista
   */
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Cargar historial de conversación desde el backend
   */
  loadHistory(): void {
    this.isLoadingHistory.set(true);

    this.chatService.getHistory().subscribe({
      next: (response) => {
        this.messages.set(response.messages);
        this.sessionId.set(response.session_id);
        this.shouldScrollToBottom = true;
        this.isLoadingHistory.set(false);
      },
      error: (error) => {
        this.errorHandler.logError('Error loading chat history', error);
        this.isLoadingHistory.set(false);

        // Manejar diferentes tipos de errores
        if (error.status === 404) {
          // 404: No hay historial - esto es normal para nuevos usuarios
          this.errorHandler.logDebug('No chat history found - this is normal for new users');
        } else if (error.status === 403 || error.status === 401) {
          // 403/401: No autenticado - mostrar mensaje y no intentar cargar
          this.errorHandler.logError('Authentication error loading chat history');
          this.messageService.add({
            severity: 'error',
            summary: 'Error de autenticación',
            detail: 'Por favor, inicia sesión nuevamente'
          });
        } else {
          // Otros errores - mostrar mensaje genérico
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el historial de chat'
          });
        }
      }
    });
  }

  /**
   * Enviar mensaje: obtener respuesta de Chrome AI y guardar en backend
   */
  async sendMessage(): Promise<void> {
    const userMessage = this.userInput().trim();

    if (!userMessage || !this.canSendMessage()) {
      return;
    }

    // Limpiar input y mostrar loading
    this.userInput.set('');
    this.isSending.set(true);

    // Scroll immediately when user sends message
    this.shouldScrollToBottom = true;

    try {
      // 1. Obtener respuesta de Chrome AI
      const aiResponse = await this.chatService.getChromeAiResponse(userMessage);

      // 2. Guardar ambos mensajes en el backend
      this.chatService.sendMessage({
        message: userMessage,
        response: aiResponse
      }).subscribe({
        next: (response) => {
          // Agregar ambos mensajes a la UI
          const currentMessages = this.messages();
          this.messages.set([
            ...currentMessages,
            response.user_message,
            response.assistant_message
          ]);

          // Actualizar session_id si es necesario
          if (response.session_id) {
            this.sessionId.set(response.session_id);
          }

          // Auto-scroll when assistant responds
          this.shouldScrollToBottom = true;
          this.isSending.set(false);
        },
        error: (error) => {
          this.errorHandler.logError('Error saving message', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.detail || 'No se pudo enviar el mensaje'
          });
          this.isSending.set(false);
        }
      });
    } catch (error: any) {
      this.errorHandler.logError('Chrome AI error', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de IA',
        detail: 'No se pudo generar una respuesta. Verifica que Chrome AI esté habilitado.'
      });
      this.isSending.set(false);
    }
  }

  /**
   * Limpiar historial de chat con confirmación
   */
  clearChat(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres borrar todo el historial de chat?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, borrar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const currentSessionId = this.sessionId();

        this.chatService.clearChat(currentSessionId || undefined).subscribe({
          next: () => {
            this.messages.set([]);
            this.sessionId.set('');
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Historial de chat borrado correctamente'
            });
          },
          error: (error) => {
            this.errorHandler.logError('Error clearing chat', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo borrar el historial'
            });
          }
        });
      }
    });
  }

  /**
   * Scroll automático al último mensaje
   * Usa smooth scroll para mejor UX
   */
  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer();
      if (container) {
        const element = container.nativeElement;
        // Use smooth scroll for better user experience
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    } catch (err) {
      this.errorHandler.logError('Error scrolling to bottom', err);
    }
  }

  /**
   * Manejar tecla Enter para enviar mensaje
   */
  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Formatear fecha a español
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  }
}
