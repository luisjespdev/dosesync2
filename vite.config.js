import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dosesync2/', // <-- CAMBIO CRÍTICO AQUÍ
})