import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';

const config: UserConfig & { test: InlineConfig } = {
  cacheDir: '../../../node_modules/.vite/libs/shared/ui',
  plugins: [angular(), nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../../apps/wisave-ui/src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/shared/ui',
    },
  },
};

export default config;
