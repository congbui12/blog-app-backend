import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    include: ['tests/**/*.test.js'], // ensure Vitest looks in tests/
    reporters: ['verbose'], // or "default"
    setupFiles: ['./tests/setup.js'],
  },
});
