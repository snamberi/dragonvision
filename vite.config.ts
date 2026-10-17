import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the same build works in a browser, a desktop wrapper, or Capacitor.
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
