import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: [
      {
        // Vitest + Node ESM resolution needs an explicit extension for the
        // SDK's bare `next/navigation` import (surfaced by the yalc-linked
        // @iblai/web-containers used by PlatformSidebar).
        find: 'next/navigation',
        replacement: 'next/navigation.js',
      },
      {
        // The SDK can resolve to a pnpm package-local absolute path that
        // bypasses bare-import aliasing. Normalize it to the project-level
        // Next.js navigation entry.
        find: /\/node_modules\/\.pnpm\/@iblai\+web-containers@[^/]+\/node_modules\/next\/navigation$/,
        replacement: new URL('./node_modules/next/navigation.js', import.meta.url).pathname,
      },
    ],
  },
  test: {
    globals: true,
    setupFiles: ['./__tests__/vitest.setup.ts'],
    environment: 'jsdom',
    exclude: ['node_modules/**', 'e2e/**', '.opencode/**'],
    server: {
      deps: {
        // Inline only the yalc-linked @iblai SDK packages so Vite transforms
        // them and applies the `next/navigation` alias above. Inlining
        // everything breaks CJS-default deps (e.g. react-paginate).
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
        'next.config.mjs',
        'sentry.*.config.*',
        'scripts/**',
      ],
    },
  },
});
