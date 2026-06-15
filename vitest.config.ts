import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Vitest owns unit/integration tests: src/**/*.test.ts(x).
// Playwright owns E2E: e2e/**/*.spec.ts (excluded here, separate runner).
// Alias is set explicitly (not via tsconfig paths) because test files are
// excluded from tsconfig, which makes vite-tsconfig-paths skip them.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'e2e', '.next', 'archive'],
  },
});
