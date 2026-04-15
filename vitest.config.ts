import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    setupFiles: ['./__tests__/vitest.setup.ts'],
    environment: 'jsdom',
    exclude: ['node_modules/**', 'e2e/**', '.opencode/**'],
    server: {
      deps: {
        inline: [/@iblai\//],
      },
    },
    coverage: {
      provider: 'istanbul',
      include: [
        'components/**/*.{ts,tsx}',
        'features/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'contexts/**/*.{ts,tsx}',
        'providers/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
      ],
      exclude: [
        // Playwright E2E tests (not unit coverage)
        'e2e/**',

        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/test-utils/**',
        // Note: 'app/**' removed to allow coverage for app pages when explicitly included via CLI
        'instrumentation.ts',
        'middleware.ts',
        'next.config.ts',
        'sentry.*.config.*',
        'scripts/**',
      ],
    },
  },
});
