import mocha from 'mocha/mocha.js';
import * as vscode from 'vscode';

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function run(): Promise<void> {
  mocha.setup({ ui: 'tdd', reporter: undefined, timeout: 5000 });

  suite('Markdown Table GUI web extension', () => {
    suiteSetup(async () => {
      const extension = vscode.extensions.getExtension('RyutaC2.markdown-table-gui');
      ensure(extension, 'Development extension was not discovered by VS Code for the Web.');
      await extension.activate();
    });

    test('registers public commands', async () => {
      const commands = await vscode.commands.getCommands(true);
      ensure(commands.includes('markdown-table-gui.editTable'), 'Edit command was not registered.');
      ensure(commands.includes('markdown-table-gui.quickInsertTable'), 'Quick insert command was not registered.');
      ensure(commands.includes('markdown-table-gui.insertTable'), 'Insert command was not registered.');
    });

    test('provides CodeLens outside code fences', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: '| a | b |\n| --- | --- |\n\n```md\n| no | table |\n| --- | --- |\n```',
      });
      await vscode.window.showTextDocument(document);
      const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>('vscode.executeCodeLensProvider', document.uri);
      ensure(lenses.length === 1, `Expected one CodeLens, received ${lenses.length}.`);
      const expectedTitle = vscode.env.language.toLowerCase().startsWith('ja') ? 'テーブルを編集' : 'Edit Table';
      ensure(lenses[0].command?.title === expectedTitle, 'CodeLens used an unexpected title.');
      const uriArgument = lenses[0].command?.arguments?.[0];
      ensure(uriArgument instanceof vscode.Uri, 'CodeLens did not include the document URI.');
      ensure(uriArgument.toString() === document.uri.toString(), 'CodeLens referenced a different document.');
      ensure(lenses[0].command?.arguments?.[1] === 0, 'CodeLens did not include the table offset.');
    });

    test('opens the table Webview command repeatedly without error', async () => {
      const document = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: '| a | b |\n| --- | --- |\n| 1 | 2 |',
      });
      await vscode.window.showTextDocument(document);
      const command = () => vscode.commands.executeCommand('markdown-table-gui.editTable', document.uri, 0);
      await command();
      await vscode.window.showTextDocument(document);
      await command();
    });
  });

  await new Promise<void>((resolve, reject) => {
    mocha.run((failures) => failures === 0 ? resolve() : reject(new Error(`${failures} web extension test(s) failed.`)));
  });
}
