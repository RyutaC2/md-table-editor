import * as vscode from 'vscode';
import { findTableAtOffset } from './core/parser';
import { TableCodeLensProvider } from './extension/codeLens';
import { registerCommands } from './extension/commands';
import { TablePanelManager } from './extension/panelManager';

export function activate(context: vscode.ExtensionContext): void {
  const panels = new TablePanelManager(context);
  const codeLens = new TableCodeLensProvider();
  context.subscriptions.push(
    panels,
    codeLens,
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, codeLens),
    vscode.window.registerWebviewPanelSerializer('markdown-table-gui.tableEditor', panels),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'markdown') {
        codeLens.refresh();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => updateTableContext(editor)),
    vscode.window.onDidChangeTextEditorSelection((event) => updateTableContext(event.textEditor)),
  );
  registerCommands(context, panels);
  void updateTableContext(vscode.window.activeTextEditor);
}

async function updateTableContext(editor: vscode.TextEditor | undefined): Promise<void> {
  const insideTable = editor?.document.languageId === 'markdown'
    && Boolean(findTableAtOffset(editor.document.getText(), editor.document.offsetAt(editor.selection.active)));
  await vscode.commands.executeCommand('setContext', 'mdTableEditor.inTable', insideTable);
}

export function deactivate(): void {
  // VS Code disposes all subscriptions registered in the extension context.
}
