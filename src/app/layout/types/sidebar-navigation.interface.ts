export interface ISidebarNavItem {
  route: string;
  label: string;
  exact: boolean;
  icon: string;
  children?: ISidebarNavChild[];
}

export interface ISidebarNavChild {
  route: string;
  label: string;
}
