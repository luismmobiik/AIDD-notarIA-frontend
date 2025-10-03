import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Servicio base para todas las llamadas a la API
 * Proporciona métodos HTTP genéricos con la URL base configurada
 *
 * CRITICAL SECURITY: CWE-522 Prevention - httpOnly Cookie Strategy
 * - Todas las peticiones incluyen withCredentials: true
 * - Esto permite enviar y recibir cookies httpOnly del backend
 * - Los tokens JWT se almacenan en cookies httpOnly (no en localStorage)
 * - Previene robo de tokens mediante XSS attacks
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  /**
   * Realizar petición GET
   * withCredentials: true permite enviar cookies httpOnly
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      params,
      withCredentials: true  // ✅ Enviar cookies httpOnly con cada request
    });
  }

  /**
   * Realizar petición POST
   * withCredentials: true permite enviar cookies httpOnly
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true  // ✅ Enviar cookies httpOnly con cada request
    });
  }

  /**
   * Realizar petición PUT
   * withCredentials: true permite enviar cookies httpOnly
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true  // ✅ Enviar cookies httpOnly con cada request
    });
  }

  /**
   * Realizar petición DELETE
   * withCredentials: true permite enviar cookies httpOnly
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      withCredentials: true  // ✅ Enviar cookies httpOnly con cada request
    });
  }

  /**
   * Realizar petición PATCH
   * withCredentials: true permite enviar cookies httpOnly
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true  // ✅ Enviar cookies httpOnly con cada request
    });
  }

  /**
   * Realizar petición GET para descargar blobs (archivos)
   * Retorna respuesta completa con headers para extraer filename
   * withCredentials: true permite enviar cookies httpOnly
   */
  getBlob(endpoint: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob',
      observe: 'response',
      withCredentials: true  // ✅ Enviar cookies httpOnly con cada request
    });
  }
}
