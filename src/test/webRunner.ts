import Mocha from 'mocha/mocha.js';
import * as vscode from 'vscode';

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true });
  mocha.suite.emit('pre-require', globalThis, 'webRunner', mocha);

  suite('Markdown Grid Editor web extension', () => {
    suiteSetup(async () => {
      const extension = vscode.extensions.getExtension('RyutaC2.md-table-editor');
      ensure(extension, 'Development extension was not discovered by VS Code for the Web.');
      await extension.activate();
    });

    test('registers public commands', async () => {
      const commands = await vscode.commands.getCommands(true);
      ensure(commands.includes('md-table-editor.editTable'), 'Edit command was not registered.');
      ensure(commands.includes('md-table-editor.insertTable'), 'Insert command was not registered.');
    });

    test('provides CodeLens outside code fences', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: '| a | b |\n| --- | --- |\n\n```md\n| no | table |\n| --- | --- |\n```',
      });
      await vscode.window.showTextDocument(document);
      const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>('vscode.executeCodeLensProvider', document.uri);
      ensure(lenses.length === 1, `Expected one CodeLens, received ${lenses.length}.`);
    });
  });

  await new Promise<void>((resolve, reject) => {
    mocha.run((failures) => failures === 0 ? resolve() : reject(new Error(`${failures} web extension test(s) failed.`)));
  });
}
