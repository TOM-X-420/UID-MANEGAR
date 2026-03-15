import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/index.js",
  external: ["postgres"],
  sourcemap: true,
  minify: false,
});

console.log("Build complete");
