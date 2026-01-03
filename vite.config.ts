import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRUCIAL: Permet au site de fonctionner même s'il n'est pas à la racine du domaine
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});