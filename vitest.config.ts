import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  test: {
    // CI-friendly reporter configuration
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI ? './test-results/junit.xml' : undefined,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 59,
        functions: 50,
        branches: 40,
        statements: 59
      },
      exclude: ['node_modules/', 'tests/setup.ts', 'src/**/*.d.ts', '**/*.config.*', '**/generated/**', '.next/', 'dist/']
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/', '.next/', 'dist/', 'tests/e2e/'],
    // Optimize for speed
    maxWorkers: process.env.CI ? 1 : undefined
  }
});