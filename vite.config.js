import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: './',
    plugins: [react()],
    define: {
        __VITE_BUILD_TIME__: JSON.stringify(Date.now().toString(36))
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/firebase')) return 'firebase';
                    if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor';
                }
            }
        }
    },
    server: {
        watch: {
            usePolling: true,
        },
    },
})
