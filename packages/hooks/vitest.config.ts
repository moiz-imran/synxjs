import { defineConfig, mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config';

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      include: ['tests/**/*.test.ts'],
      setupFiles: [],
    },
  })
);