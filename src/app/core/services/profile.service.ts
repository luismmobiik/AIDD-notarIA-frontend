import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Modelo de perfil de usuario
 */
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

/**
 * Request para actualizar perfil
 */
export interface UpdateProfileRequest {
  name: string;
  email: string;
  phone: string;
}

/**
 * Request para cambiar contraseña
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/**
 * Response de cambio de contraseña
 */
export interface ChangePasswordResponse {
  message: string;
}

/**
 * Servicio de gestión de perfil de usuario
 * SRP: Maneja únicamente operaciones relacionadas con el perfil del usuario
 * DIP: Depende de ApiService (abstracción) no de implementación HTTP directa
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiService = inject(ApiService);

  /**
   * Obtener perfil del usuario actual
   */
  getProfile(): Observable<Profile> {
    return this.apiService.get<Profile>('/users/profile');
  }

  /**
   * Actualizar perfil del usuario
   */
  updateProfile(data: UpdateProfileRequest): Observable<Profile> {
    return this.apiService.put<Profile>('/users/profile', data);
  }

  /**
   * Cambiar contraseña del usuario
   */
  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.apiService.put<ChangePasswordResponse>('/users/password', data);
  }
}
