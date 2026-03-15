import { defineConfig } from 'orval';

export default defineConfig({
  uidManager: {
    input: './openapi.yaml',
    output: {
      mode: 'single',
      target: '../api-client-react/src/generated.ts',
      client: 'react-query',
      httpClient: 'fetch',
    },
  },
  uidManagerZod: {
    input: './openapi.yaml',
    output: {
      mode: 'single',
      target: '../api-zod/src/generated.ts',
      client: 'zod',
    },
  },
});
