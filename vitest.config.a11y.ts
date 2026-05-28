import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
test: {
environment: 'jsdom',
globals: true,
setupFiles: ['./tests/setup.ts'],
include: [
'tests/**/*.a11y.test.tsx',
'tests/**/*.a11y.spec.tsx',
],
exclude: [
'node_modules/',
'.next/',
'dist/',
],
coverage: {
    enabled: false,
},
reporters: process.env.CI ? ['default', 'junit'] : ['default'],
outputFile: process.env.CI ? './test-results/junit-a11y.xml' : undefined,
},
resolve: {
alias: {
'@': path.resolve(__dirname, './src'),
'@core': path.resolve(__dirname, './src/core'),
'@application': path.resolve(__dirname, './src/application'),
'@infrastructure': path.resolve(__dirname, './src/infrastructure'),
'@shared': path.resolve(__dirname, './src/shared'),
},
},
});
