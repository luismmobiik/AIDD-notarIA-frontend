import { Injectable } from '@angular/core';

/**
 * Servicio para gestionar el almacenamiento local (localStorage)
 * Proporciona métodos tipo-seguros para almacenar y recuperar datos
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * Guardar un elemento en localStorage
   */
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  /**
   * Obtener un elemento de localStorage
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
      return null;
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  }

  /**
   * Eliminar un elemento de localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
    }
  }

  /**
   * Limpiar todo el localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }
}
