export type ErrorCategory = 'validation' | 'network' | 'server';

export interface IStoreError {
  message: string;
  category: ErrorCategory;
}
