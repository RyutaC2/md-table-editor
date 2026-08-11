import * as vscode from 'vscode';
import { applyOperation } from '../core/operations';
import { findTableAtOffset, parseMarkdownTables } from '../core/parser';
import { serializeTable } from '../core/serializer';
import type { MarkdownTable, TableSnapshot } from '../core/types';
import type { CellPosition, EditorState, ExtensionMessage, PersistedPanelState, WebviewMessage } from '../shared/protocol';
import { language, message } from './locale';

interface TableSession {
  key: string;
  panel: vscode.WebviewPanel;
  uri: vscode.Uri;
  tableStartOffset: number;
  tableEndOffset: number;
  sourceColumn: vscode.ViewColumn;
  documentVersion: number;
  snapshot: TableSnapshot;
  selection?: CellPosition;
  applyingEdit: boolean;
  startEditing: boolean;
  revealGeneration: number;
  disposables: vscode.Disposable[];
}

const viewType = 'md-table-editor.tableEditor';

function sessionKey(uri: vscode.Uri, startOffset: number): string {
  return `${uri.toString()}#${startOffset}`;
}

function snapshot(table: MarkdownTable): TableSnapshot {
  return {
    rows: table.rows.map((row) => [...row]),
    alignments: [...table.alignments],
    widths: [...table.widths],
    format: { ...table.format },
  };
}

function nonce(): string {
  const values = new Uint32Array(4);
  globalThis.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join('');
}

function transformOffset(offset: number, changes: readonly vscode.TextDocumentContentChangeEvent[]): number | undefined {
  let transformed = offset;
  const ordered = [...changes].sort((left, right) => left.rangeOffset - right.rangeOffset);
  for (const change of ordered) {
    const end = change.rangeOffset + change.rangeLength;
    if (end <= transformed) {
      transformed += change.text.length - change.rangeLength;
    } else if (change.rangeOffset <= transformed) {
      return undefined;
    }
  }
  return transformed;
}

export class TablePanelManager implements vscode.Disposable, vscode.WebviewPanelSerializer {
  private readonly sessions = new Map<string, TableSession>();
  private readonly disposables: vscode.Disposable[] = [];
  private readonly updateTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => this.onDocumentChanged(event)),
      vscode.window.onDidChangeTextEditorSelection((event) => this.onSourceSelection(event)),
    );
  }

  async open(document: vscode.TextDocument, table: MarkdownTable, startEditing = false): Promise<void> {
    const existing = this.findSession(document.uri, table.startOffset);
    if (existing) {
      existing.panel.reveal(existing.panel.viewColumn, false);
      await this.sendState(existing, document, table, startEditing);
      return;
    }

    const sourceColumn = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    const panel = vscode.window.createWebviewPanel(
      viewType,
      this.titleFor(table),
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'), ...this.workspaceRoots()],
      },
    );
    panel.webview.html = this.html(panel.webview);
    const session = this.createSession(panel, document, table, sourceColumn, startEditing);
    this.sessions.set(session.key, session);
    await this.sendState(session, document, table, startEditing);
    if (table.rows.length > 500 || table.widths.length > 50) {
      void vscode.window.showWarningMessage(message('largeTable'));
    }
  }

  async deserializeWebviewPanel(panel: vscode.WebviewPanel, state: PersistedPanelState): Promise<void> {
    try {
      const uri = vscode.Uri.parse(state.uri);
      const document = await vscode.workspace.openTextDocument(uri);
      const table = findTableAtOffset(document.getText(), state.tableStartOffset)
        ?? this.nearestTable(document.getText(), state.tableStartOffset);
      if (!table) {
        panel.dispose();
        void vscode.window.showWarningMessage(message('restoreFailed'));
        return;
      }
      panel.webview.options = {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'), ...this.workspaceRoots()],
      };
      panel.webview.html = this.html(panel.webview);
      const session = this.createSession(panel, document, table, vscode.ViewColumn.One, false);
      this.sessions.set(session.key, session);
      await this.sendState(session, document, table, false);
    } catch {
      panel.dispose();
      void vscode.window.showWarningMessage(message('restoreFailed'));
    }
  }

  private createSession(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument,
    table: MarkdownTable,
    sourceColumn: vscode.ViewColumn,
    startEditing: boolean,
  ): TableSession {
    const session: TableSession = {
      key: sessionKey(document.uri, table.startOffset),
      panel,
      uri: document.uri,
      tableStartOffset: table.startOffset,
      tableEndOffset: table.endOffset,
      sourceColumn,
      documentVersion: document.version,
      snapshot: snapshot(table),
      applyingEdit: false,
      startEditing,
      revealGeneration: 0,
      disposables: [],
    };
    session.disposables.push(
      panel.webview.onDidReceiveMessage((incoming: WebviewMessage) => this.onMessage(session, incoming)),
      panel.onDidDispose(() => this.removeSession(session)),
    );
    return session;
  }

  private async onMessage(session: TableSession, incoming: WebviewMessage): Promise<void> {
    switch (incoming.type) {
      case 'ready': {
        const document = await vscode.workspace.openTextDocument(session.uri);
        const table = findTableAtOffset(document.getText(), session.tableStartOffset);
        if (table) {
          await this.sendState(session, document, table, session.startEditing);
          session.startEditing = false;
        }
        break;
      }
      case 'operation':
        await this.applyWebviewOperation(session, incoming);
        break;
      case 'revealCell':
        await this.revealCell(session, incoming.cell);
        break;
      case 'undo':
      case 'redo':
        await this.runHistory(session, incoming.type);
        break;
      case 'openLink':
        if (/^https:\/\//iu.test(incoming.href)) {
          await vscode.env.openExternal(vscode.Uri.parse(incoming.href));
        }
        break;
    }
  }

  private async applyWebviewOperation(
    session: TableSession,
    incoming: Extract<WebviewMessage, { type: 'operation' }>,
  ): Promise<void> {
    const document = await vscode.workspace.openTextDocument(session.uri);
    const table = findTableAtOffset(document.getText(), session.tableStartOffset);
    if (!table) {
      this.closeRemoved(session);
      return;
    }
    if (incoming.documentVersion !== document.version) {
      await this.sendState(session, document, table, false);
      this.post(session, { type: 'notice', level: 'warning', message: message('staleEdit') });
      return;
    }

    const updated = applyOperation(snapshot(table), incoming.operation);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(session.uri, new vscode.Range(document.positionAt(table.startOffset), document.positionAt(table.endOffset)), serializeTable(updated));
    session.applyingEdit = true;
    const applied = await vscode.workspace.applyEdit(edit);
    session.applyingEdit = false;
    if (!applied) {
      this.post(session, { type: 'notice', level: 'error', message: message('staleEdit') });
      return;
    }
    const currentDocument = await vscode.workspace.openTextDocument(session.uri);
    const currentTable = findTableAtOffset(currentDocument.getText(), table.startOffset);
    if (currentTable) {
      session.selection = incoming.selection;
      await this.sendState(session, currentDocument, currentTable, false);
    }
  }

  private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    for (const session of this.sessions.values()) {
      if (session.uri.toString() !== event.document.uri.toString()) {
        continue;
      }
      const transformed = transformOffset(session.tableStartOffset, event.contentChanges);
      if (transformed !== undefined) {
        session.tableStartOffset = transformed;
      }
      const currentTimer = this.updateTimers.get(session.key);
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      const timer = setTimeout(() => {
        this.updateTimers.delete(session.key);
        void this.refreshSession(session, event.document);
      }, session.applyingEdit ? 0 : 120);
      this.updateTimers.set(session.key, timer);
    }
  }

  private async refreshSession(session: TableSession, document: vscode.TextDocument): Promise<void> {
    const table = findTableAtOffset(document.getText(), session.tableStartOffset);
    if (!table) {
      this.closeRemoved(session);
      return;
    }
    await this.sendState(session, document, table, false);
  }

  private async sendState(session: TableSession, document: vscode.TextDocument, table: MarkdownTable, startEditing: boolean): Promise<void> {
    session.revealGeneration += 1;
    this.rekey(session, table.startOffset);
    session.tableEndOffset = table.endOffset;
    session.documentVersion = document.version;
    session.snapshot = snapshot(table);
    session.panel.title = this.titleFor(table);
    const state: EditorState = {
      uri: document.uri.toString(),
      tableStartOffset: table.startOffset,
      documentVersion: document.version,
      snapshot: session.snapshot,
      selection: session.selection,
      language: language(),
      oversized: table.rows.length > 500 || table.widths.length > 50,
      workspaceResourceBase: this.workspaceResourceBase(session, document.uri),
      startEditing,
    };
    this.post(session, { type: 'load', state });
  }

  private async revealCell(session: TableSession, cell: CellPosition): Promise<void> {
    const generation = ++session.revealGeneration;
    const document = await vscode.workspace.openTextDocument(session.uri);
    if (generation !== session.revealGeneration) {
      return;
    }
    const table = findTableAtOffset(document.getText(), session.tableStartOffset);
    const range = table?.cellRanges[cell.row]?.[cell.column];
    if (!range) {
      return;
    }
    const editor = await vscode.window.showTextDocument(document, { viewColumn: session.sourceColumn, preserveFocus: true, preview: false });
    if (generation !== session.revealGeneration) {
      return;
    }
    session.selection = cell;
    editor.selection = new vscode.Selection(document.positionAt(range.start), document.positionAt(range.end));
    editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }

  private onSourceSelection(event: vscode.TextEditorSelectionChangeEvent): void {
    const offset = event.textEditor.document.offsetAt(event.selections[0].active);
    for (const session of this.sessions.values()) {
      if (session.uri.toString() !== event.textEditor.document.uri.toString()) {
        continue;
      }
      const table = findTableAtOffset(event.textEditor.document.getText(), session.tableStartOffset);
      if (!table) {
        continue;
      }
      for (let row = 0; row < table.cellRanges.length; row += 1) {
        const column = table.cellRanges[row].findIndex((range) => offset >= range.start && offset <= range.end);
        if (column >= 0) {
          const selection = { row, column };
          if (session.selection?.row !== row || session.selection.column !== column) {
            session.revealGeneration += 1;
            session.selection = selection;
            this.post(session, { type: 'selection', selection });
          }
          break;
        }
      }
    }
  }

  private async runHistory(session: TableSession, command: 'undo' | 'redo'): Promise<void> {
    const document = await vscode.workspace.openTextDocument(session.uri);
    await vscode.window.showTextDocument(document, { viewColumn: session.sourceColumn, preserveFocus: false, preview: false });
    await vscode.commands.executeCommand(command);
    session.panel.reveal(session.panel.viewColumn, false);
  }

  private closeRemoved(session: TableSession): void {
    session.panel.dispose();
    void vscode.window.showWarningMessage(message('tableRemoved'));
  }

  private nearestTable(source: string, offset: number): MarkdownTable | undefined {
    return parseMarkdownTables(source)
      .sort((left, right) => Math.abs(left.startOffset - offset) - Math.abs(right.startOffset - offset))[0];
  }

  private findSession(uri: vscode.Uri, offset: number): TableSession | undefined {
    return [...this.sessions.values()].find((session) =>
      session.uri.toString() === uri.toString()
      && offset >= session.tableStartOffset
      && offset <= session.tableEndOffset,
    );
  }

  private rekey(session: TableSession, startOffset: number): void {
    const nextKey = sessionKey(session.uri, startOffset);
    if (nextKey !== session.key) {
      this.sessions.delete(session.key);
      session.key = nextKey;
      this.sessions.set(nextKey, session);
    }
    session.tableStartOffset = startOffset;
  }

  private titleFor(table: MarkdownTable): string {
    const heading = table.rows[0].filter(Boolean).slice(0, 2).join(' · ');
    return heading ? `Table: ${heading}` : `Table ${table.startLine + 1}`;
  }

  private post(session: TableSession, outgoing: ExtensionMessage): void {
    void session.panel.webview.postMessage(outgoing);
  }

  private html(webview: vscode.Webview): string {
    const script = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'webview.js'));
    const style = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'webview.css'));
    const token = nonce();
    return `<!doctype html>
<html lang="${language()}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${token}';">
  <link rel="stylesheet" href="${style}">
  <title>Markdown Grid Editor</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${token}" src="${script}"></script>
</body>
</html>`;
  }

  private workspaceRoots(): vscode.Uri[] {
    return vscode.workspace.workspaceFolders?.map(({ uri }) => uri) ?? [];
  }

  private workspaceResourceBase(session: TableSession, documentUri: vscode.Uri): string | undefined {
    const folder = vscode.workspace.getWorkspaceFolder(documentUri);
    if (!folder) {
      return undefined;
    }
    return session.panel.webview.asWebviewUri(vscode.Uri.joinPath(folder.uri, '/')).toString();
  }

  private removeSession(session: TableSession): void {
    this.sessions.delete(session.key);
    const timer = this.updateTimers.get(session.key);
    if (timer) {
      clearTimeout(timer);
      this.updateTimers.delete(session.key);
    }
    session.disposables.forEach((disposable) => disposable.dispose());
  }

  dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    [...this.sessions.values()].forEach((session) => session.panel.dispose());
    this.updateTimers.forEach((timer) => clearTimeout(timer));
    this.updateTimers.clear();
  }
}
