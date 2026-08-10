import * as vscode from 'vscode';
import { findTableAtOffset } from '../core/parser';
import { createTableMarkdown } from '../core/serializer';
import type { MarkdownTable } from '../core/types';
import { message } from './locale';
import type { TablePanelManager } from './panelManager';

interface SizeItem extends vscode.QuickPickItem {
  columns: number;
  rows: number;
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

  const insert = vscode.commands.registerCommand('md-table-editor.insertTable', async () => {
    const editor = activeMarkdownEditor();
    if (!editor) {
      void vscode.window.showWarningMessage(message('invalidDocument'));
      return;
    }
    const selected = await vscode.window.showQuickPick(sizeItems(), {
      title: message('insertTable'),
      placeHolder: '3 × 3',
      matchOnDescription: true,
    });
    if (!selected) {
      return;
    }

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
    const markdown = createTableMarkdown(selected.columns, selected.rows, eol);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, document.positionAt(insertionOffset), before + markdown + after);
    if (!await vscode.workspace.applyEdit(edit)) {
      return;
    }
    const updated = await vscode.workspace.openTextDocument(document.uri);
    const table = findTableAtOffset(updated.getText(), insertionOffset + before.length);
    if (table) {
      await panels.open(updated, table, true);
    }
  });

  context.subscriptions.push(edit, insert);
  return [edit, insert];
}

function sizeItems(): SizeItem[] {
  const items: SizeItem[] = [];
  for (let rows = 1; rows <= 8; rows += 1) {
    for (let columns = 1; columns <= 8; columns += 1) {
      items.push({
        label: `${columns} × ${rows}`,
        description: columns === 3 && rows === 3 ? message('recommended') : undefined,
        columns,
        rows,
      });
    }
  }
  return items.sort((left, right) => Number(right.columns === 3 && right.rows === 3) - Number(left.columns === 3 && left.rows === 3));
}
