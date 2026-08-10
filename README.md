# md-table-editor

Markdown の表を、Visual Studio Code 上の GUI で編集できる拡張機能を開発しています。

## 現在の状態

このリポジトリは、環境構築直後の開発用雛形です。現在実装されているのは、拡張機能の有効化確認とサンプルコマンドだけです。Markdown 表の検出・表示・編集・保存は、まだ利用できません。

## 現在確認できる操作

開発環境で拡張機能を起動すると、コマンドパレットから次の操作を確認できます。

1. VS Code でこのリポジトリを開きます。
2. `F5` を押して「Run Extension」を起動します。
3. 拡張機能開発ホストでコマンドパレットを開きます。
4. `Hello World` を実行します。
5. `Hello World from md_table_editor!` という情報メッセージが表示されます。

このコマンドは拡張機能の動作確認用であり、最終的な表編集機能ではありません。

## 開発環境のセットアップ

### 必要な環境

- Visual Studio Code
- Node.js と npm

VS Code 拡張機能の対象バージョンは `package.json` の `engines.vscode` で管理しています。

### インストールとビルド

リポジトリのルートで実行してください。

```bash
npm install
npm run compile
```

`npm run compile` は、TypeScript の型チェック、ESLint、esbuild によるバンドルを順番に実行します。バンドルされた拡張機能は `dist/extension.js` に出力されます。

### テスト

```bash
npm test
```

テストコードは `src/test` に配置しています。現在は VS Code 拡張機能テストの初期サンプルが登録されています。

## 開発用コマンド

| コマンド | 用途 |
| --- | --- |
| `npm run compile` | 型チェック、Lint、開発用ビルド |
| `npm run check-types` | TypeScript の型チェック |
| `npm run lint` | ESLint の実行 |
| `npm test` | 拡張機能テストの実行 |
| `npm run package` | 配布用ビルド |
| `npm run watch` | TypeScript と esbuild の監視ビルド |

## 今後の実装予定

- Markdown 表を解析して編集可能なデータとして扱う
- VS Code 上に表編集用の GUI を表示する
- セルの追加・削除や内容の編集を行う
- 編集結果を元の Markdown ファイルへ書き戻す
- 不正な表記や複雑なセル内容を適切に扱う

上記は開発予定であり、現時点で提供されている機能ではありません。

## 既知の制限

- Markdown 表の編集機能は未実装です。
- 設定項目は提供していません。
- `Hello World` コマンドは開発用サンプルです。
- 公開用のリリース版はまだありません。

## リリースノート

### 0.0.1

- VS Code 拡張機能の初期雛形を作成しました。
- 拡張機能の有効化確認用に `Hello World` コマンドを追加しました。
