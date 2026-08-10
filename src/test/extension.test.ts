import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Markdown Grid Editor extension', () => {
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
  });
});
