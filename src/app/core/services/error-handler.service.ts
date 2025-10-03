import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * ErrorHandlerService - Manejo centralizado de errores y logging
 *
 * CRITICAL SECURITY: CWE-209 Prevention - Information Exposure Through Error Message
 *
 * SRP: Responsable únicamente del logging de errores según el entorno
 *
 * Características:
 * - Logging condicional basado en environment.production
 * - En desarrollo: console.error/log/warn habilitado
 * - En producción: logs deshabilitados (evita exposición de información sensible)
 * - Preparado para integración con servicios de monitoreo (Sentry, etc.)
 *
 * Beneficios de seguridad:
 * - Previene exposición de stack traces en producción
 * - Evita filtración de IDs de documentos, emails, rutas
 * - Elimina información que puede ayudar a atacantes
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  /**
   * Log error only in development mode
   * In production, send to monitoring service (Sentry, etc.)
   *
   * @param message - Mensaje descriptivo del error
   * @param error - Objeto de error opcional con stack trace
   */
  logError(message: string, error?: any): void {
    if (!environment.production) {
      console.error(message, error);
    } else {
      // TODO: En producción, enviar a servicio de monitoreo
      // Ejemplo: Sentry.captureException(error, { tags: { message } });
    }
  }

  /**
   * Log debug info only in development mode
   * Útil para debugging de flujo de aplicación
   *
   * @param message - Mensaje descriptivo
   * @param data - Datos opcionales para contexto
   */
  logDebug(message: string, data?: any): void {
    if (!environment.production) {
      console.log(message, data);
    }
  }

  /**
   * Log warning in all environments
   * Para warnings que deben ser monitoreados incluso en producción
   *
   * @param message - Mensaje de advertencia
   * @param data - Datos opcionales para contexto
   */
  logWarning(message: string, data?: any): void {
    if (!environment.production) {
      console.warn(message, data);
    } else {
      // TODO: En producción, enviar a servicio de monitoreo
      // Ejemplo: Sentry.captureMessage(message, 'warning');
    }
  }
}
