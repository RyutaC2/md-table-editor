import * as vscode from 'vscode';
import { parseMarkdownTables } from '../core/parser';
import { message } from './locale';

export class TableCodeLensProvider implements vscode.CodeLensProvider {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.emitter.event;

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (document.languageId !== 'markdown') {
      return [];
    }
    return parseMarkdownTables(document.getText()).map((table) => {
      const position = new vscode.Position(table.startLine, 0);
      return new vscode.CodeLens(new vscode.Range(position, position), {
        title: message('editTable'),
        command: 'markdown-table-gui.editTable',
        arguments: [document.uri, table.startOffset],
      });
    });
  }

  refresh(): void {
    this.emitter.fire();
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
