const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const problemMatcher = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => console.log(`[build] ${build.initialOptions.outfile ?? build.initialOptions.outdir}`));
    build.onEnd((result) => {
      for (const { text, location } of result.errors) {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}`);
        }
      }
    });
  },
};

const shared = {
  bundle: true,
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  logLevel: 'silent',
  plugins: [problemMatcher],
};

async function createContexts() {
  return Promise.all([
    esbuild.context({
      ...shared,
      entryPoints: ['src/extension.ts'],
      format: 'cjs',
      platform: 'node',
      outfile: 'dist/extension.js',
      external: ['vscode'],
    }),
    esbuild.context({
      ...shared,
      entryPoints: ['src/extension.ts'],
      format: 'cjs',
      platform: 'browser',
      outfile: 'dist/browser/extension.js',
      external: ['vscode'],
    }),
    esbuild.context({
      ...shared,
      entryPoints: { webview: 'src/webview/index.tsx' },
      format: 'iife',
      platform: 'browser',
      outdir: 'dist/webview',
      entryNames: '[name]',
      assetNames: '[name]',
    }),
    esbuild.context({
      ...shared,
      entryPoints: ['src/test/webRunner.ts'],
      format: 'cjs',
      platform: 'browser',
      outfile: 'dist/web-test/index.js',
      external: ['vscode'],
      define: { global: 'globalThis' },
    }),
  ]);
}

async function main() {
  const contexts = await createContexts();
  if (watch) {
    await Promise.all(contexts.map((context) => context.watch()));
    return;
  }
  await Promise.all(contexts.map((context) => context.rebuild()));
  await Promise.all(contexts.map((context) => context.dispose()));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
