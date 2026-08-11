import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);
const { applyOperation } = require('../out-unit/core/operations.js');
const { parseMarkdownTables } = require('../out-unit/core/parser.js');
const { serializeTable } = require('../out-unit/core/serializer.js');
const { readTabularWorkbook, workbookRows, writeTabularFile } = require('../out-unit/core/tabularFiles.js');

function makeSnapshot(rowCount, columnCount, unicode) {
  return {
    rows: Array.from({ length: rowCount }, (_, row) => (
      Array.from({ length: columnCount }, (_, column) => (
        row === 0 ? `Header ${column + 1}` : unicode ? `${row}-${column}-表😀` : `${row}-${column}-value`
      ))
    )),
    alignments: Array.from({ length: columnCount }, (_, column) => (
      ['none', 'left', 'center', 'right'][column % 4]
    )),
    widths: Array.from({ length: columnCount }, () => 12),
    format: { leadingPipe: true, trailingPipe: true, padded: true, eol: '\n' },
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(label, samples, action) {
  action();
  const durations = [];
  for (let sample = 0; sample < samples; sample += 1) {
    const start = performance.now();
    action();
    durations.push(performance.now() - start);
  }
  return {
    operation: label,
    medianMs: Number(median(durations).toFixed(2)),
    minMs: Number(Math.min(...durations).toFixed(2)),
    maxMs: Number(Math.max(...durations).toFixed(2)),
  };
}

function importTabularFile(data, type) {
  const workbook = readTabularWorkbook(data, type);
  return workbookRows(workbook, workbook.SheetNames[0]);
}

for (const scenario of [
  { name: 'guaranteed-ascii-50x500', rows: 500, columns: 50, samples: 7, unicode: false },
  { name: 'guaranteed-unicode-50x500', rows: 500, columns: 50, samples: 7, unicode: true },
  { name: 'oversized-unicode-100x2000', rows: 2000, columns: 100, samples: 3, unicode: true },
]) {
  const source = makeSnapshot(scenario.rows, scenario.columns, scenario.unicode);
  const markdown = serializeTable(source);
  const results = [
    measure('parse', scenario.samples, () => parseMarkdownTables(markdown)),
    measure('serialize', scenario.samples, () => serializeTable(source)),
    measure('set-one-cell', scenario.samples, () => applyOperation(source, {
      type: 'setCells',
      changes: [{ row: scenario.rows - 1, column: scenario.columns - 1, value: 'updated' }],
    })),
    measure('auto-fit-all', scenario.samples, () => applyOperation(source, { type: 'autoFit' })),
    measure('sort-one-column', scenario.samples, () => applyOperation(source, { type: 'sort', column: 0, direction: 'descending' })),
  ];
  console.log(`\n${scenario.name}: ${scenario.columns} columns × ${scenario.rows} rows, ${(Buffer.byteLength(markdown) / 1024).toFixed(1)} KiB Markdown`);
  console.table(results);

  if (scenario.rows <= 500) {
    const csv = writeTabularFile(source, 'csv');
    const xlsx = writeTabularFile(source, 'xlsx');
    const fileResults = [
      measure('export-csv', 3, () => writeTabularFile(source, 'csv')),
      measure('import-csv', 3, () => importTabularFile(csv, 'csv')),
      measure('export-xlsx', 3, () => writeTabularFile(source, 'xlsx')),
      measure('import-xlsx', 3, () => importTabularFile(xlsx, 'xlsx')),
    ];
    console.log(`CSV ${(csv.byteLength / 1024).toFixed(1)} KiB; XLSX ${(xlsx.byteLength / 1024).toFixed(1)} KiB`);
    console.table(fileResults);
  }
}
