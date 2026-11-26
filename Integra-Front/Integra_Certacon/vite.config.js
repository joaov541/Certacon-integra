import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({

  plugins: [react()],

  server: {

    proxy: {

      '/api-receita': {

        target: 'https://piloto-cbs.tributos.gov.br',

        changeOrigin: true,

        secure: true,

        rewrite: (path) =>
          path.replace(
            /^\/api-receita/,
            '/servico/calculadora-consumo/api'
          ),

        configure: (proxy) => {

          proxy.on('proxyReq', (proxyReq) => {

            // Protege as credenciais do IntegraCertacon
            proxyReq.removeHeader('authorization')
            proxyReq.removeHeader('cookie')

          })

          proxy.on('proxyRes', (proxyRes, req) => {

            console.log(
              '[Receita Federal]',
              req.url,
              'Status:',
              proxyRes.statusCode,
              'Redirect:',
              proxyRes.headers.location || 'Nenhum'
            )

          })

          proxy.on('error', (erro) => {

            console.error(
              '[Receita Federal] Erro:',
              erro.message
            )

          })

        }

      }

    }

  }

})