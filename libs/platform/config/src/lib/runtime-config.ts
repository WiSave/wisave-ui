interface RuntimeEnv {
  API_BASE_URL?: string;
}

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

const DEFAULT_API_BASE_URL = '/api';

export function getApiBaseUrl(): string {
  const runtimeEnv = window.__env;
  const apiBaseUrl = runtimeEnv?.API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  return apiBaseUrl.replace(/\/+$/, '');
}

export type { RuntimeEnv };
