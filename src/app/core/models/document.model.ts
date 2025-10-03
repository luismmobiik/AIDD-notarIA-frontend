/**
 * Modelos de datos para Documentos
 * Alineados con backend models (document.py)
 */

export interface Document {
  id?: string;
  user_id: string;
  name: string;
  type: DocumentType;
  content?: Record<string, any>;
  parties?: Record<string, any>;
  terms?: Record<string, any>;
  status: DocumentStatus;
  created_at?: string;
  updated_at?: string;
  notarized_at?: string | null;
}

// Alineado con backend DocumentType enum
export type DocumentType =
  | 'contrato_compraventa'
  | 'contrato_arrendamiento'
  | 'contrato_servicios'
  | 'escritura_propiedad'
  | 'escritura_empresa'
  | 'testamento'
  | 'poder_notarial'
  | 'acta_constitutiva';

// Alineado con backend DocumentStatus enum
export type DocumentStatus =
  | 'borrador'
  | 'completado'
  | 'notarizado';

// Alineado con backend DocumentCreate model
export interface CreateDocumentRequest {
  name: string;
  type: DocumentType;
  content?: Record<string, any>;
  parties?: Record<string, any>;
  terms?: Record<string, any>;
}

export interface CreateDocumentResponse {
  message: string;
  document: Document;
}

export interface UpdateDocumentRequest {
  name?: string;
  content?: Record<string, any>;
  parties?: Record<string, any>;
  terms?: Record<string, any>;
  status?: DocumentStatus;
}

// Interfaz para formulario de parte involucrada
export interface DocumentParty {
  name: string;
  id: string;
  address: string;
}

// Interfaz para término/condición
export interface DocumentTerm {
  key: string;
  value: string;
}

// Opciones de tipos de documentos para el select
export interface DocumentTypeOption {
  label: string;
  value: DocumentType;
}

// Summary para lista de documentos (sin content/parties/terms)
export interface DocumentSummary {
  id: string;
  user_id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  notarized_at?: string | null;
}

// Response de lista de documentos con metadata
export interface DocumentListResponse {
  documents: DocumentSummary[];
  total: number;
  skip: number;
  limit: number;
}

// Parámetros de búsqueda/filtrado
export interface DocumentListParams {
  q?: string;
  type?: string;
  status?: string;
  skip?: number;
  limit?: number;
  sort?: string;
}
