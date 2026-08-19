import * as assert from 'assert';
import * as vscode from 'vscode';
import { parseMarkdownTables } from '../core/parser';

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
  return tab.input.viewType === 'markdown-table-gui.tableEditor'
    || tab.input.viewType.endsWith('-markdown-table-gui.tableEditor');
}

function tableWebviewTabs(): vscode.Tab[] {
  return vscode.window.tabGroups.all
    .flatMap((group) => [...group.tabs])
    .filter(isTableWebviewTab);
}

function textTab(uri: vscode.Uri): vscode.Tab | undefined {
  return vscode.window.tabGroups.all
    .flatMap((group) => [...group.tabs])
    .find((tab) => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString());
}

suite('Markdown Table GUI extension', () => {
  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension('RyutaC2.markdown-table-gui');
    assert.ok(extension, 'Development extension was not discovered by VS Code.');
    await extension.activate();
  });

  test('registers public commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('markdown-table-gui.editTable'));
    assert.ok(commands.includes('markdown-table-gui.quickInsertTable'));
    assert.ok(commands.includes('markdown-table-gui.insertTable'));
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
    assert.ok(lenses.every((lens) => lens.command?.command === 'markdown-table-gui.editTable'));
    const expectedTitle = vscode.env.language.toLowerCase().startsWith('ja') ? 'テーブルを編集' : 'Edit Table';
    assert.ok(lenses.every((lens) => lens.command?.title === expectedTitle));
    assert.deepStrictEqual(lenses.map((lens) => lens.range.start.line), [0, 9]);
    const uriArgument = lenses[0].command?.arguments?.[0];
    assert.ok(uriArgument instanceof vscode.Uri);
    assert.strictEqual(uriArgument.toString(), document.uri.toString());
    assert.strictEqual(lenses[0].command?.arguments?.[1], 0);
  });

  test('reuses the only Webview tab when another table starts editing', async function () {
    this.timeout(5000);
    const firstDocument = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '| a | b |\n| --- | --- |\n| 1 | 2 |',
    });
    const secondDocument = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '| c | d |\n| --- | --- |\n| 3 | 4 |',
    });
    await vscode.window.showTextDocument(firstDocument);
    await vscode.commands.executeCommand('markdown-table-gui.editTable', firstDocument.uri, 0);
    const opened = await waitFor(() => {
      const tabs = tableWebviewTabs();
      return tabs.length === 1 ? tabs : undefined;
    });
    assert.strictEqual(opened.length, 1);
    const firstFileName = firstDocument.fileName.split(/[\\/]/u).at(-1);
    assert.strictEqual(opened[0].label, `table: ${firstFileName}`);

    await vscode.window.showTextDocument(secondDocument, { viewColumn: vscode.ViewColumn.One, preserveFocus: false });
    await vscode.commands.executeCommand('markdown-table-gui.editTable', secondDocument.uri, 0);
    const switched = await waitFor(() => {
      const tabs = tableWebviewTabs();
      const secondFileName = secondDocument.fileName.split(/[\\/]/u).at(-1);
      return tabs.length === 1 && tabs[0].label === `table: ${secondFileName}` ? tabs : undefined;
    });
    assert.strictEqual(switched.length, 1);

    await vscode.window.showTextDocument(secondDocument, { viewColumn: vscode.ViewColumn.One, preserveFocus: false });
    await vscode.commands.executeCommand('markdown-table-gui.editTable', secondDocument.uri, 0);
    await waitFor(() => tableWebviewTabs().length === 1 ? true : undefined);
    assert.strictEqual(await vscode.window.tabGroups.close(switched), true);
  });

  test('closes the Webview when its source file closes', async function () {
    this.timeout(5000);
    const extension = vscode.extensions.getExtension('RyutaC2.markdown-table-gui');
    assert.ok(extension);
    const uri = vscode.Uri.joinPath(extension.extensionUri, `.md-table-gui-close-test-${Date.now()}.md`);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode('| a | b |\n| --- | --- |\n| 1 | 2 |'));
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
      await vscode.commands.executeCommand('markdown-table-gui.editTable', document.uri, 0);
      await waitFor(() => tableWebviewTabs().length === 1 ? true : undefined);
      const sourceTab = textTab(uri);
      assert.ok(sourceTab, 'The source text tab was not found.');
      assert.strictEqual(await vscode.window.tabGroups.close(sourceTab), true);
      await waitFor(() => tableWebviewTabs().length === 0 ? true : undefined);
    } finally {
      await vscode.workspace.fs.delete(uri);
    }
  });

  test('keeps the Webview open across built-in light, dark, and high-contrast themes', async function () {
    this.timeout(10000);
    const document = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '| theme | value |\n| --- | --- |\n| current | test |',
    });
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('markdown-table-gui.editTable', document.uri, 0);
    const opened = await waitFor(() => {
      const tabs = tableWebviewTabs();
      return tabs.length === 1 ? tabs : undefined;
    });
    const configuration = vscode.workspace.getConfiguration('workbench');
    const originalTheme = configuration.inspect<string>('colorTheme')?.globalValue;
    const themes: Array<[string, vscode.ColorThemeKind]> = [
      ['Light Modern', vscode.ColorThemeKind.Light],
      ['Dark Modern', vscode.ColorThemeKind.Dark],
      ['Default High Contrast', vscode.ColorThemeKind.HighContrast],
      ['Default High Contrast Light', vscode.ColorThemeKind.HighContrastLight],
    ];
    try {
      for (const [theme, kind] of themes) {
        await configuration.update('colorTheme', theme, vscode.ConfigurationTarget.Global);
        await waitFor(() => vscode.window.activeColorTheme.kind === kind ? true : undefined);
        assert.strictEqual(tableWebviewTabs().length, 1, `${theme} closed the table Webview.`);
      }
    } finally {
      await configuration.update('colorTheme', originalTheme, vscode.ConfigurationTarget.Global);
      assert.strictEqual(await vscode.window.tabGroups.close(opened), true);
    }
  });

  test('quick inserts a two-column table with a header and one data row', async function () {
    this.timeout(5000);
    const document = await vscode.workspace.openTextDocument({ language: 'markdown', content: '# Test' });
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('markdown-table-gui.quickInsertTable');
    const table = await waitFor(() => parseMarkdownTables(document.getText())[0]);
    assert.strictEqual(table.widths.length, 2);
    assert.strictEqual(table.rows.length, 2);
    const tabs = tableWebviewTabs();
    if (tabs.length > 0) {
      assert.strictEqual(await vscode.window.tabGroups.close(tabs), true);
    }
  });
});
