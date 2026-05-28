export interface IPlan {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  interval: 'month' | null;
  features: string[];
  recommended?: boolean;
}

export interface IAccountStepData {
  name: string;
  email: string;
  password: string;
}
