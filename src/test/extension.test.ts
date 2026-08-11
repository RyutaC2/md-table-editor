import * as assert from 'assert';
import * as vscode from 'vscode';

async function waitFor<T>(value: () => T | undefined, timeout = 2000): Promise<T> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const current = value();
    if (current !== undefined) {
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for VS Code UI state.');
}

function isTableWebviewTab(tab: vscode.Tab): boolean {
  if (!(tab.input instanceof vscode.TabInputWebview)) {
    return false;
  }
  return tab.input.viewType === 'md-table-editor.tableEditor'
    || tab.input.viewType.endsWith('-md-table-editor.tableEditor');
}

suite('Markdown Grid Editor extension', () => {
  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension('RyutaC2.md-table-editor');
    assert.ok(extension, 'Development extension was not discovered by VS Code.');
    await extension.activate();
  });

  test('registers public commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('md-table-editor.editTable'));
    assert.ok(commands.includes('md-table-editor.insertTable'));
  });

  test('provides one CodeLens for each table outside code fences', async () => {
    const document = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: [
        '| a | b |',
        '| --- | --- |',
        '| 1 | 2 |',
        '',
        '```md',
        '| ignored | table |',
        '| --- | --- |',
        '```',
        '',
        'x | y',
        '--- | ---',
      ].join('\n'),
    });
    await vscode.window.showTextDocument(document);
    const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>('vscode.executeCodeLensProvider', document.uri);
    assert.strictEqual(lenses.length, 2);
    assert.ok(lenses.every((lens) => lens.command?.command === 'md-table-editor.editTable'));
    assert.deepStrictEqual(lenses.map((lens) => lens.range.start.line), [0, 9]);
    const uriArgument = lenses[0].command?.arguments?.[0];
    assert.ok(uriArgument instanceof vscode.Uri);
    assert.strictEqual(uriArgument.toString(), document.uri.toString());
    assert.strictEqual(lenses[0].command?.arguments?.[1], 0);
  });

  test('opens one Webview tab per table and reuses the existing panel', async function () {
    this.timeout(5000);
    const document = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '| a | b |\n| --- | --- |\n| 1 | 2 |',
    });
    await vscode.window.showTextDocument(document);
    const command = () => vscode.commands.executeCommand('md-table-editor.editTable', document.uri, 0);
    await command();
    const tableTabs = (): vscode.Tab[] => vscode.window.tabGroups.all
      .flatMap((group) => [...group.tabs])
      .filter(isTableWebviewTab);
    const opened = await waitFor(() => {
      const tabs = tableTabs();
      return tabs.length === 1 ? tabs : undefined;
    });
    assert.strictEqual(opened.length, 1);

    await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One, preserveFocus: false });
    await command();
    await waitFor(() => tableTabs().length === 1 ? true : undefined);
    assert.strictEqual(await vscode.window.tabGroups.close(opened), true);
  });
});
