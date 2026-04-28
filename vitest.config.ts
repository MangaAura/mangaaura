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
'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
],
exclude: [
'node_modules/',
'.next/',
'dist/',
],
coverage: {
provider: 'v8',
reporter: ['text', 'json', 'html'],
exclude: [
'node_modules/',
'tests/setup.ts',
'src/**/*.d.ts',
'**/*.config.*',
'**/generated/**',
'.next/',
'dist/',
],
},
// CI-friendly reporter configuration
reporters: process.env.CI
? ['default', 'junit']
: ['default'],
outputFile: process.env.CI ? './test-results/junit.xml' : undefined,
// Optimize for speed
minWorkers: 1,
maxWorkers: process.env.CI ? 1 : undefined,
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
