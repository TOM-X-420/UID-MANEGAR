import { defineConfig } from "orval";

export default defineConfig({
  "api-zod": {
    input: "./openapi.yaml",
    output: {
      target: "../api-zod/src/index.ts",
      client: "zod",
      fileExtension: ".ts",
      override: {
        zod: {
          generate: {
            header: false,
          },
        },
      },
    },
  },
  "api-client-react": {
    input: "./openapi.yaml",
    output: {
      target: "../api-client-react/src/index.ts",
      client: "react-query",
      httpClient: "fetch",
      fileExtension: ".ts",
    },
  },
});
