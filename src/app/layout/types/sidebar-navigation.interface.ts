export interface ISidebarNavItem {
  route: string;
  label: string;
  exact: boolean;
  icon: string;
  children?: ISidebarNavChild[];
  requiredPermission?: string;
}

export interface ISidebarNavChild {
  route: string;
  label: string;
}
