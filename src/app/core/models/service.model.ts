/**
 * Modelos de datos para Servicios Notariales
 */

/**
 * Servicio notarial individual
 * Mapea la respuesta del endpoint GET /api/services
 */
export interface Service {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  icon: string;  // PrimeIcon class (e.g., 'pi-file-edit')
  estimated_price: string;
  features: string[];
}

/**
 * Categoría de servicios para filtrado
 */
export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}
