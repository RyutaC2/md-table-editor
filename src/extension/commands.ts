import * as vscode from 'vscode';
import { findTableAtOffset } from '../core/parser';
import { createTableMarkdown } from '../core/serializer';
import type { MarkdownTable } from '../core/types';
import { message } from './locale';
import type { TablePanelManager } from './panelManager';

interface CountItem extends vscode.QuickPickItem {
  count: number;
}

function activeMarkdownEditor(): vscode.TextEditor | undefined {
  const editor = vscode.window.activeTextEditor;
  return editor?.document.languageId === 'markdown' ? editor : undefined;
}

function tableFromArgument(document: vscode.TextDocument, uri: vscode.Uri | undefined, offset: number | undefined): MarkdownTable | undefined {
  if (uri?.toString() !== document.uri.toString() || offset === undefined) {
    return undefined;
  }
  return findTableAtOffset(document.getText(), offset);
}

export function registerCommands(context: vscode.ExtensionContext, panels: TablePanelManager): vscode.Disposable[] {
  const edit = vscode.commands.registerCommand(
    'md-table-editor.editTable',
    async (uri?: vscode.Uri, offset?: number) => {
      const editor = activeMarkdownEditor();
      if (!editor) {
        void vscode.window.showWarningMessage(message('invalidDocument'));
        return;
      }
      const cursorOffset = editor.document.offsetAt(editor.selection.active);
      const table = tableFromArgument(editor.document, uri, offset)
        ?? findTableAtOffset(editor.document.getText(), cursorOffset);
      if (!table) {
        void vscode.window.showInformationMessage(message('noTable'));
        return;
      }
      await panels.open(editor.document, table);
    },
  );

  const quickInsert = vscode.commands.registerCommand('md-table-editor.quickInsertTable', async () => {
    const editor = activeMarkdownEditor();
    if (!editor) {
      void vscode.window.showWarningMessage(message('invalidDocument'));
      return;
    }
    await insertTable(editor, panels, 2, 2);
  });

  const insert = vscode.commands.registerCommand('md-table-editor.insertTable', async () => {
    const editor = activeMarkdownEditor();
    if (!editor) {
      void vscode.window.showWarningMessage(message('invalidDocument'));
      return;
    }
    const rows = await vscode.window.showQuickPick(countItems(message('rows')), {
      title: message('selectRows'),
      placeHolder: '2',
    });
    if (!rows) {
      return;
    }
    const columns = await vscode.window.showQuickPick(countItems(message('columns')), {
      title: message('selectColumns'),
      placeHolder: '2',
    });
    if (!columns) {
      return;
    }
    await insertTable(editor, panels, columns.count, rows.count);
  });

  context.subscriptions.push(edit, quickInsert, insert);
  return [edit, quickInsert, insert];
}

async function insertTable(
  editor: vscode.TextEditor,
  panels: TablePanelManager,
  columns: number,
  rows: number,
): Promise<void> {
  const document = editor.document;
  const source = document.getText();
  const cursorOffset = document.offsetAt(editor.selection.active);
  const containingTable = findTableAtOffset(source, cursorOffset);
  const line = document.lineAt(editor.selection.active.line);
  const insertionOffset = containingTable?.endOffset ?? document.offsetAt(line.range.end);
  const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  const before = insertionOffset === 0
    ? ''
    : source.slice(0, insertionOffset).endsWith(eol + eol)
      ? ''
      : source.slice(0, insertionOffset).endsWith(eol) ? eol : eol + eol;
  const after = insertionOffset === source.length
    ? ''
    : source.slice(insertionOffset).startsWith(eol + eol)
      ? ''
      : source.slice(insertionOffset).startsWith(eol) ? eol : eol + eol;
  const markdown = createTableMarkdown(columns, rows, eol);
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.insert(document.uri, document.positionAt(insertionOffset), before + markdown + after);
  if (!await vscode.workspace.applyEdit(workspaceEdit)) {
    return;
  }
  const updated = await vscode.workspace.openTextDocument(document.uri);
  const table = findTableAtOffset(updated.getText(), insertionOffset + before.length);
  if (table) {
    await panels.open(updated, table, true);
  }
}

function countItems(unit: string): CountItem[] {
  return Array.from({ length: 20 }, (_, index) => ({
    label: String(index + 1),
    description: unit,
    count: index + 1,
  }));
}
