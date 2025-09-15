import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: 'src/test/setup.ts',
    // Only run unit tests with Vitest; Playwright E2E runs via `npm run e2e`
    include: ['tests/unit/**/*.test.ts', 'src/test/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'playwright/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage'
    }
  }
});