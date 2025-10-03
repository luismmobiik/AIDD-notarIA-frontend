/**
 * Modelos de datos para Chat / Asesor Legal IA
 */

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface SendMessageRequest {
  message: string;
  response: string;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  session_id: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
}
