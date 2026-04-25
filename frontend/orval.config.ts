import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      target: './src/api/generated.ts',
      client: 'react-query',
      mode: 'single',
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
        },
      },
    },
  },
})
