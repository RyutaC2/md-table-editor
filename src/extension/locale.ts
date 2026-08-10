import * as vscode from 'vscode';

export type MessageKey =
  | 'editTable'
  | 'insertTable'
  | 'noTable'
  | 'tableRemoved'
  | 'staleEdit'
  | 'restoreFailed'
  | 'invalidDocument'
  | 'largeTable'
  | 'recommended';

const messages: Record<'en' | 'ja', Record<MessageKey, string>> = {
  en: {
    editTable: 'Edit in GUI',
    insertTable: 'Insert Markdown Table',
    noTable: 'Place the cursor inside a Markdown table.',
    tableRemoved: 'The table was removed or is no longer valid. The GUI editor was closed.',
    staleEdit: 'The source changed before the GUI edit was applied. The latest table was loaded.',
    restoreFailed: 'The table editor could not be restored because its table was not found.',
    invalidDocument: 'Open a Markdown file before using this command.',
    largeTable: 'This table is larger than the guaranteed 50 × 500 size. It remains fully editable.',
    recommended: 'Recommended',
  },
  ja: {
    editTable: 'GUIで編集',
    insertTable: 'Markdownテーブルを挿入',
    noTable: 'Markdownテーブル内にカーソルを置いてください。',
    tableRemoved: '対象テーブルが削除されたか、不正な構文になったためGUIを閉じました。',
    staleEdit: 'GUIの編集前にソースが変更されました。最新のテーブルを読み込みました。',
    restoreFailed: '対象テーブルを検出できないため、GUIを復元できませんでした。',
    invalidDocument: 'Markdownファイルを開いてから実行してください。',
    largeTable: '保証サイズの50列×500行を超えています。データを省略せず編集を継続します。',
    recommended: '推奨',
  },
};

export function language(): 'en' | 'ja' {
  return vscode.env.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function message(key: MessageKey): string {
  return messages[language()][key];
}
