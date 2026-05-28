import type { RuntimeEnv } from '../app/core/config/runtime-config';

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

export {};
