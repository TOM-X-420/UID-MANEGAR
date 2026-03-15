import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/index.cjs',
  format: 'cjs',
  external: ['postgres'],
  alias: {
    '@workspace/db': join(__dirname, '../../lib/db/src/index.ts'),
    '@workspace/api-zod': join(__dirname, '../../lib/api-zod/src/index.ts'),
  },
});
