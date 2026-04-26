import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { getApiBaseUrl } from '@core/config/runtime-config';
import {
  type ISettingsAccessManagementResponse,
  type ISettingsRole,
  type ISettingsUser,
  type ICreateRoleRequest,
  type IUpdateRolePermissionsRequest,
  type IUpdateUserRolesRequest,
} from '@features/settings/types/settings-admin.types';

@Injectable({ providedIn: 'root' })
export class SettingsAdminApiService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = `${getApiBaseUrl()}/admin/access-management`;

  getAccessManagement(): Observable<ISettingsAccessManagementResponse> {
    return this.#http.get<ISettingsAccessManagementResponse>(this.#apiUrl);
  }

  getRoles(): Observable<ISettingsRole[]> {
    return this.#http.get<ISettingsRole[]>(`${this.#apiUrl}/roles`);
  }

  getUsers(): Observable<ISettingsUser[]> {
    return this.#http.get<ISettingsUser[]>(`${this.#apiUrl}/users`);
  }

  createRole(name: string, permissions: string[] = []): Observable<ISettingsRole> {
    const request: ICreateRoleRequest = { name, permissions };
    return this.#http.post<ISettingsRole>(`${this.#apiUrl}/roles`, request);
  }

  updateUserRoles(userId: string, roleIds: string[]): Observable<ISettingsUser> {
    const request: IUpdateUserRolesRequest = { roleIds };
    return this.#http.put<ISettingsUser>(`${this.#apiUrl}/users/${encodeURIComponent(userId)}/roles`, request);
  }

  updateRolePermissions(roleId: string, permissions: string[]): Observable<ISettingsRole> {
    const request: IUpdateRolePermissionsRequest = { permissions };
    return this.#http.put<ISettingsRole>(`${this.#apiUrl}/roles/${encodeURIComponent(roleId)}/permissions`, request);
  }
}
