import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(resolve(repositoryRoot, 'package-lock.json'), 'utf8'));

const groups = [
  {
    title: 'Google Material Symbols and SheetJS Community Edition',
    packages: ['xlsx'],
    extra: [
      '- Google Material Symbols: <https://github.com/google/material-design-icons>',
      '- SheetJS Community Edition: <https://sheetjs.com/>',
    ],
    license: 'node_modules/xlsx/LICENSE',
  },
  {
    title: 'TanStack Virtual',
    packages: ['@tanstack/react-virtual', '@tanstack/virtual-core'],
    license: 'node_modules/@tanstack/react-virtual/LICENSE',
  },
  {
    title: 'markdown-it',
    packages: ['markdown-it'],
    license: 'node_modules/markdown-it/LICENSE',
  },
  {
    title: 'argparse',
    packages: ['argparse'],
    license: 'node_modules/argparse/LICENSE',
  },
  {
    title: 'entities',
    packages: ['entities'],
    license: 'node_modules/entities/LICENSE',
  },
  {
    title: 'linkify-it',
    packages: ['linkify-it'],
    license: 'node_modules/linkify-it/LICENSE',
  },
  {
    title: 'mdurl',
    packages: ['mdurl'],
    license: 'node_modules/mdurl/LICENSE',
  },
  {
    title: 'punycode.js and uc.micro',
    packages: ['punycode.js', 'uc.micro'],
    license: 'node_modules/punycode.js/LICENSE-MIT.txt',
  },
  {
    title: 'React',
    packages: ['react', 'react-dom', 'scheduler'],
    license: 'node_modules/react/LICENSE',
  },
];

function packageVersion(name) {
  const version = lock.packages?.[`node_modules/${name}`]?.version;
  if (typeof version !== 'string') {
    throw new Error(`Missing production dependency in package-lock.json: ${name}`);
  }
  return version;
}

const sections = groups.map((group) => {
  const packageList = group.packages.map((name) => `- ${name} ${packageVersion(name)}`).join('\n');
  const extra = group.extra ? `\n${group.extra.join('\n')}\n` : '';
  const license = readFileSync(resolve(repositoryRoot, group.license), 'utf8').trim();
  return `## ${group.title}\n\n${packageList}${extra}\n\n\`\`\`text\n${license}\n\`\`\``;
});

const output = `# Third-party notices

Markdown Grid Editor bundles the following third-party software. The complete license text used by each bundled package is reproduced below. Google Material Symbols SVG paths are embedded locally in the Webview icon component.

${sections.join('\n\n')}
`;

const outputPath = resolve(repositoryRoot, 'THIRD_PARTY_NOTICES.md');
if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== output) {
    console.error('THIRD_PARTY_NOTICES.md is stale. Run `npm run notices`.');
    process.exitCode = 1;
  }
} else {
  writeFileSync(outputPath, output);
}
