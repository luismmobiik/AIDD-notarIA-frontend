/**
 * Modelos de datos para Dashboard
 */

/**
 * Estadísticas del dashboard del usuario
 */
export interface DashboardStats {
  total_documents: number;
  completed_documents: number;
  in_progress_documents: number;
}

/**
 * Datos completos del dashboard
 * Incluye información del usuario y estadísticas
 */
export interface DashboardData {
  user_name: string;
  user_email: string;
  stats: DashboardStats;
}

/**
 * Resumen de un documento para la lista de recientes
 */
export interface DocumentSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Item de navegación en el menú horizontal
 */
export interface NavItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
}

/**
 * Tarjeta de acceso rápido
 */
export interface QuickAccessCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}
