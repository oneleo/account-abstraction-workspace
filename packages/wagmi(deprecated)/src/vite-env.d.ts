/// <reference types="vite/client" />

export default defineConfig({
    resolve: {
        alias: [
            {
                find: 'web3',
                replacement: 'web3/dist/web3.min.js',
            },
        ],
    },
})