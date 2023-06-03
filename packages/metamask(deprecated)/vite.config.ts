import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // The following Vite alias resolutions are necessary when working with Ethers.js v5:
    resolve: {
        alias: [
            {
                find: 'web3',
                replacement: 'web3/dist/web3.min.js',
            },
        ],
    },
})
