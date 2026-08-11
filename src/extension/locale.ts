import * as vscode from 'vscode';

export type MessageKey =
  | 'editTable'
  | 'quickInsertTable'
  | 'insertTable'
  | 'selectRows'
  | 'selectColumns'
  | 'rows'
  | 'columns'
  | 'noTable'
  | 'tableRemoved'
  | 'staleEdit'
  | 'restoreFailed'
  | 'invalidDocument'
  | 'largeTable'
  | 'importTitle'
  | 'selectSheet'
  | 'importFailed'
  | 'imported'
  | 'exportTitle'
  | 'exportFailed'
  | 'exported'
  | 'unsupportedTableFile';

const messages: Record<'en' | 'ja', Record<MessageKey, string>> = {
  en: {
    editTable: 'Edit in GUI',
    quickInsertTable: 'Quick Insert Markdown Table',
    insertTable: 'Insert Markdown Table',
    selectRows: 'Select the number of rows (including the header)',
    selectColumns: 'Select the number of columns',
    rows: 'rows',
    columns: 'columns',
    noTable: 'Place the cursor inside a Markdown table.',
    tableRemoved: 'The table was removed or is no longer valid. The GUI editor was closed.',
    staleEdit: 'The source changed before the GUI edit was applied. The latest table was loaded.',
    restoreFailed: 'The table editor could not be restored because its table was not found.',
    invalidDocument: 'Open a Markdown file before using this command.',
    largeTable: 'This table is larger than the guaranteed 50 × 500 size. It remains fully editable.',
    importTitle: 'Import and replace the current table',
    selectSheet: 'Select the worksheet to import',
    importFailed: 'The CSV or XLSX file could not be imported.',
    imported: 'The current table was replaced with the imported data.',
    exportTitle: 'Export the complete current table',
    exportFailed: 'The table could not be exported as CSV or XLSX.',
    exported: 'The complete table was exported.',
    unsupportedTableFile: 'Choose a file with a .csv or .xlsx extension.',
  },
  ja: {
    editTable: 'GUIで編集',
    quickInsertTable: 'Markdownテーブルをクイック挿入',
    insertTable: 'Markdownテーブルを挿入',
    selectRows: '行数を選択（ヘッダーを含む）',
    selectColumns: '列数を選択',
    rows: '行',
    columns: '列',
    noTable: 'Markdownテーブル内にカーソルを置いてください。',
    tableRemoved: '対象テーブルが削除されたか、不正な構文になったためGUIを閉じました。',
    staleEdit: 'GUIの編集前にソースが変更されました。最新のテーブルを読み込みました。',
    restoreFailed: '対象テーブルを検出できないため、GUIを復元できませんでした。',
    invalidDocument: 'Markdownファイルを開いてから実行してください。',
    largeTable: '保証サイズの50列×500行を超えています。データを省略せず編集を継続します。',
    importTitle: 'インポートして現在の表全体を置換',
    selectSheet: 'インポートするワークシートを選択',
    importFailed: 'CSVまたはXLSXファイルをインポートできませんでした。',
    imported: 'インポートしたデータで現在の表全体を置換しました。',
    exportTitle: '現在の表全体をエクスポート',
    exportFailed: '表をCSVまたはXLSXとしてエクスポートできませんでした。',
    exported: '現在の表全体をエクスポートしました。',
    unsupportedTableFile: '拡張子が.csvまたは.xlsxのファイルを選択してください。',
  },
};

export function language(): 'en' | 'ja' {
  return vscode.env.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function message(key: MessageKey): string {
  return messages[language()][key];
}
