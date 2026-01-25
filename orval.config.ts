import { defineConfig } from 'orval';

export default defineConfig({
  // Bloco 1: Cliente React Query + Types
  unnoqApi: {
    input: {
      target: 'http://localhost:4000/docs-json',
      filters: {
        tags: ['devolucao-mobile','produto'],
      },
    },
    output: {
      headers: true,
      prettier: true,
      mode: 'tags-split',
      target: 'src/_services/api/service',
      schemas: 'src/_services/api/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/_services/http/axios.http.ts',
          name: 'axiosFetcher',
        },
      },
    },
  },

  // Bloco 2: Apenas schemas Zod
  unnoqApiZod: {
    input: {
      target: 'http://localhost:4000/docs-json',
      filters: {
        tags: ['devolucao-mobile','produto'],
      },
    },
    output: {
      client: 'zod',
      target: 'src/_services/api/schema',
      fileExtension: '.zod.ts',
      mode: 'tags-split',
    },
  },
});
