import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Document,
  CreateDocumentRequest,
  CreateDocumentResponse,
  UpdateDocumentRequest,
  DocumentListResponse,
  DocumentListParams
} from '../models/document.model';

/**
 * DocumentService - Servicio para gestión de documentos
 *
 * SRP: Encapsula toda la lógica de API relacionada con documentos
 * Maneja CRUD operations y comunicación con backend
 *
 * Características:
 * - 100% Signals para estado reactivo
 * - inject() para dependency injection
 * - Observable para operaciones HTTP
 * - Integración con ApiService para llamadas autenticadas
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiService = inject(ApiService);

  // Signals para estado de documentos
  documents = signal<Document[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Crear nuevo documento
   * POST /api/documents
   */
  createDocument(documentData: CreateDocumentRequest): Observable<CreateDocumentResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.apiService.post<CreateDocumentResponse>('/documents/', documentData);
  }

  /**
   * Obtener documento por ID
   * GET /api/documents/:id
   */
  getDocument(id: string): Observable<Document> {
    return this.apiService.get<Document>(`/documents/${id}`);
  }

  /**
   * Obtener lista de documentos del usuario con filtros y paginación
   * GET /api/documents?q=search&type=...&status=...&skip=0&limit=20&sort=-created_at
   */
  getDocuments(params?: DocumentListParams): Observable<DocumentListResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    // Construir query params
    let queryString = '';
    if (params) {
      const queryParams: string[] = [];

      if (params.q) queryParams.push(`q=${encodeURIComponent(params.q)}`);
      if (params.type) queryParams.push(`type=${encodeURIComponent(params.type)}`);
      if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
      if (params.skip !== undefined) queryParams.push(`skip=${params.skip}`);
      if (params.limit !== undefined) queryParams.push(`limit=${params.limit}`);
      if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`);

      if (queryParams.length > 0) {
        queryString = '?' + queryParams.join('&');
      }
    }

    return this.apiService.get<DocumentListResponse>(`/documents/${queryString}`);
  }

  /**
   * Obtener documentos recientes (para dashboard)
   * GET /api/documents/recent
   */
  getRecentDocuments(): Observable<Document[]> {
    return this.apiService.get<Document[]>('/documents/recent');
  }

  /**
   * Actualizar documento existente
   * PUT /api/documents/:id
   */
  updateDocument(id: string, updates: UpdateDocumentRequest): Observable<Document> {
    return this.apiService.put<Document>(`/documents/${id}`, updates);
  }

  /**
   * Eliminar documento
   * DELETE /api/documents/:id
   */
  deleteDocument(id: string): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/documents/${id}`);
  }

  /**
   * Descargar documento como PDF
   * GET /api/documents/:id/download
   *
   * Retorna objeto con blob del PDF y nombre de archivo extraído del header Content-Disposition
   */
  downloadDocument(id: string): Observable<{ blob: Blob; filename: string }> {
    return this.apiService.getBlob(`/documents/${id}/download`).pipe(
      map(response => {
        // Extraer filename del header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `documento-${id}.pdf`; // Filename por defecto

        if (contentDisposition) {
          // Buscar patrón filename="..." o filename*=UTF-8''...
          const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
            // Decodificar si está en formato UTF-8
            filename = decodeURIComponent(filename);
          }
        }

        return {
          blob: response.body!,
          filename: filename
        };
      })
    );
  }

  /**
   * Solicitar notarización de documento
   * POST /api/documents/:id/notarize
   */
  notarizeDocument(id: string): Observable<Document> {
    return this.apiService.post<Document>(`/documents/${id}/notarize`, {});
  }

  /**
   * Marcar documento como completado
   * POST /api/documents/:id/complete
   *
   * Solo documentos con status='borrador' pueden ser completados.
   * Una vez completado, el documento no puede ser editado pero sí notarizado.
   */
  completeDocument(id: string): Observable<Document> {
    return this.apiService.post<Document>(`/documents/${id}/complete`, {});
  }
}
