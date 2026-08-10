import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Markdown Grid Editor extension', () => {
  test('registers public commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('md-table-editor.editTable'));
    assert.ok(commands.includes('md-table-editor.insertTable'));
  });
});
