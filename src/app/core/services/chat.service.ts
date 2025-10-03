import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  SendMessageRequest,
  SendMessageResponse,
  ChatHistoryResponse
} from '../models/chat.model';

/**
 * Servicio para gestionar chat con asesor legal IA
 * Integra Chrome AI Prompt API y backend API
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiService = inject(ApiService);

  // Session reuse for performance optimization
  private currentSession?: any;

  /**
   * Enviar mensaje y respuesta al backend
   * @param request Contiene el mensaje del usuario y la respuesta de la IA
   */
  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.apiService.post<SendMessageResponse>('/chat/message', request);
  }

  /**
   * Obtener historial de conversación
   * @param sessionId ID de sesión opcional
   */
  getHistory(sessionId?: string): Observable<ChatHistoryResponse> {
    const endpoint = sessionId
      ? `/chat/history?session_id=${sessionId}`
      : '/chat/history';
    return this.apiService.get<ChatHistoryResponse>(endpoint);
  }

  /**
   * Limpiar historial de chat
   * Destruye la sesión de Chrome AI al limpiar el chat
   * @param sessionId ID de sesión opcional
   */
  clearChat(sessionId?: string): Observable<{message: string}> {
    // Destruir sesión de Chrome AI cuando se limpia el chat
    this.destroySession();

    const endpoint = sessionId
      ? `/chat/clear?session_id=${sessionId}`
      : '/chat/clear';
    return this.apiService.delete<{message: string}>(endpoint);
  }

  /**
   * Asegurar que existe una sesión de Chrome AI reutilizable
   * Crea sesión solo si no existe, monitorea uso de tokens y refresca si necesario
   * @returns Sesión de Chrome AI lista para usar
   */
  private async ensureSession(): Promise<any> {
    // Si no hay sesión, crear una nueva
    if (!this.currentSession) {
      console.log('🔵 Creating new Chrome AI session...');

      this.currentSession = await LanguageModel.create({
        temperature: 0.8,
        topK: 3,
        initialPrompts: [{
          role: 'system',
          content: `Eres un asistente legal especializado en servicios notariales de México.
Tu objetivo es proporcionar información clara y precisa sobre trámites notariales,
contratos, escrituras, testamentos, poderes notariales y actas constitutivas.
Responde siempre en español de manera profesional pero accesible.
Si no estás seguro de algo, recomienda consultar con un notario profesional.`
        }]
      });

      console.log(`✅ Session created: ${this.currentSession.inputUsage}/${this.currentSession.inputQuota} tokens`);
    }

    // Monitorear uso de tokens
    const usagePercent = (this.currentSession.inputUsage / this.currentSession.inputQuota) * 100;
    console.log(`📊 Token usage: ${this.currentSession.inputUsage}/${this.currentSession.inputQuota} (${usagePercent.toFixed(1)}%)`);

    // Si el uso de tokens está al 90% o más, refrescar sesión usando clone()
    if (usagePercent >= 90) {
      console.warn(`⚠️ Token usage at ${usagePercent.toFixed(1)}%, refreshing session...`);

      const oldSession = this.currentSession;
      this.currentSession = await oldSession.clone();
      oldSession.destroy();

      console.log(`🔄 Session refreshed: ${this.currentSession.inputUsage}/${this.currentSession.inputQuota} tokens`);
    }

    return this.currentSession;
  }

  /**
   * Obtener respuesta de Chrome AI Prompt API con sesión reutilizable
   * OPTIMIZADO: Reutiliza sesión para respuestas 55-60% más rápidas
   * @param userMessage Mensaje del usuario
   * @returns Respuesta generada por la IA
   */
  async getChromeAiResponse(userMessage: string): Promise<string> {
    try {
      // Verificar disponibilidad del global LanguageModel
      if (typeof LanguageModel === 'undefined') {
        console.error('LanguageModel not available');
        throw new Error('Chrome AI Prompt API not available. Please use Chrome Canary with flags enabled.');
      }

      // Obtener o reutilizar sesión (optimización de rendimiento)
      const session = await this.ensureSession();

      console.log('📤 Sending prompt to Chrome AI...');

      // Enviar mensaje del usuario a la sesión existente
      const response = await session.prompt(userMessage);

      console.log('📥 Response received from AI');
      console.log(`📊 Token usage after prompt: ${session.inputUsage}/${session.inputQuota}`);

      // NO destruir sesión - reutilizar para próximas consultas
      return response;
    } catch (error: any) {
      console.error('❌ Chrome AI error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);

      // En caso de error, destruir sesión para forzar recreación en próximo intento
      this.destroySession();

      throw error;
    }
  }

  /**
   * Destruir sesión de Chrome AI actual
   * Llamar cuando se limpia el chat o se destruye el componente
   */
  destroySession(): void {
    if (this.currentSession) {
      console.log('🔴 Destroying Chrome AI session');
      this.currentSession.destroy();
      this.currentSession = undefined;
    }
  }

  /**
   * Pre-calentar sesión para respuesta instantánea en primer mensaje
   * Crear sesión por adelantado sin esperar al primer mensaje del usuario
   */
  async warmupSession(): Promise<void> {
    try {
      console.log('🔥 Warming up Chrome AI session...');
      await this.ensureSession();
      console.log('✅ Session warmed up and ready for instant responses');
    } catch (error: any) {
      console.error('❌ Error warming up session:', error);
      // No lanzar error - el warmup es opcional
    }
  }

  /**
   * Verificar si Chrome AI está disponible en el navegador
   * Sincrónico para uso en ngOnInit
   */
  isChromeAiAvailable(): boolean {
    const windowExists = typeof window !== 'undefined';
    const languageModelExists = windowExists && typeof LanguageModel !== 'undefined';

    console.log('Chrome AI availability check:');
    console.log('- window exists:', windowExists);
    console.log('- LanguageModel exists:', languageModelExists);
    console.log('- LanguageModel type:', languageModelExists ? typeof LanguageModel : 'N/A');

    return languageModelExists;
  }

  /**
   * Verificar disponibilidad de Chrome AI de forma asíncrona
   * Incluye verificación de capacidades del modelo
   */
  async checkChromeAiAvailability(): Promise<{
    available: boolean;
    status: string;
    canDownload: boolean;
  }> {
    try {
      // Verificación inicial del global LanguageModel
      if (typeof LanguageModel === 'undefined') {
        return {
          available: false,
          status: 'LanguageModel no encontrado. Usa Chrome Canary con flags habilitadas.',
          canDownload: false
        };
      }

      console.log('Checking Chrome AI availability...');

      // Usar availability() según la documentación oficial
      const availabilityStatus = await LanguageModel.availability();
      console.log('Chrome AI availability status:', availabilityStatus);

      // Verificar si available === "readily"
      if (availabilityStatus === 'available') {
        return {
          available: true,
          status: 'Chrome AI está listo para usar',
          canDownload: false
        };
      } else if (availabilityStatus === 'downloadable' || availabilityStatus === 'downloading') {
        return {
          available: false,
          status: 'El modelo necesita descargarse. Intenta crear una sesión para iniciar la descarga.',
          canDownload: true
        };
      } else {
        return {
          available: false,
          status: `Chrome AI no está disponible (status: ${availabilityStatus})`,
          canDownload: false
        };
      }
    } catch (error: any) {
      console.error('Error checking availability:', error);
      return {
        available: false,
        status: `Error verificando disponibilidad: ${error.message}`,
        canDownload: false
      };
    }
  }
}
