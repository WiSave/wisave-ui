import type { RuntimeEnv } from '@wisave/platform/config';

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

export {};
