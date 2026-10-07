import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environmentOptions: {
      jsdom: {
        // Suppress "act" warnings in tests
        resources: 'usable',
      },
    },
    // Treat "act" warnings as non-fatal
    onConsoleLog(log) {
      if (log.includes('was not wrapped in act')) {
        return false; // Suppress the warning
      }
      return true;
    },
  },
});
