export interface ISettingsRole {
  id: string;
  name: string;
  normalizedName: string;
  concurrencyStamp?: string;
  permissions: string[];
}

export interface ISettingsRoleViewModel extends ISettingsRole {
  displayName: string;
}

export interface ISettingsUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  canEditRoles: boolean;
}

export interface ISettingsAccessManagementResponse {
  canManagePrivilegedRoles: boolean;
  availablePermissions: string[];
  roles: ISettingsRole[];
  users: ISettingsUser[];
}

export interface IUpdateUserRolesRequest {
  roleIds: string[];
}

export interface IUpdateRolePermissionsRequest {
  permissions: string[];
}

export interface ICreateRoleRequest {
  name: string;
  permissions: string[];
}

export interface ISettingsPageSizeOption {
  label: string;
  value: number;
}

export type PermissionDomain = 'expenses' | 'incomes' | 'stocks' | 'other';
