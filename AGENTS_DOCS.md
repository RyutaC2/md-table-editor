# md-table-editor リポジトリ仕様書

このファイルは、`md-table-editor` の現状と設計意図を AI が把握するための仕様書です。実装を変更する際は、まずこのファイルを確認し、変更後の状態と差異が生じないように更新してください。

## プロジェクト概要

本リポジトリは、Markdown ファイルに記述された表（Markdown table）を、Visual Studio Code 上の GUI で編集する拡張機能を開発するためのものです。

現在は VS Code 拡張機能の初期雛形を整えた段階です。表の解析、GUI の表示、編集内容の Markdown への書き戻しはまだ実装されていません。したがって、現行コードを完成済みの表編集機能として扱ってはいけません。

## 現在の実装状態

- エントリポイントは `src/extension.ts` です。
- 拡張機能の起動時に `activate` が呼び出され、拡張機能が有効化されたことをログへ出力します。
- `md-table-editor.helloWorld` コマンドを登録しています。
- `md-table-editor.helloWorld` の表示名は `Hello World` です。
- コマンドを実行すると、`Hello World from md_table_editor!` という情報メッセージを表示します。
- `src/test/extension.test.ts` には、VS Code 拡張機能テストの初期サンプルが存在します。
- `package.json` に設定画面用の `contributes.configuration` はありません。
- Markdown 表を扱うためのパーサー、Webview、エディター連携は未実装です。

この最小実装を残しているのは、拡張機能の有効化、コマンド登録、テスト実行という開発基盤を確認できる状態を先に確保するためです。表編集機能を追加する際は、既存のサンプルコマンドをそのまま機能の一部とみなさず、不要になった時点で整理してください。

## ディレクトリと主要ファイル

| パス | 役割 |
| --- | --- |
| `src/extension.ts` | 拡張機能の有効化処理とコマンド登録 |
| `src/test/extension.test.ts` | VS Code 拡張機能テスト |
| `package.json` | 拡張機能のメタデータ、コマンド定義、npm スクリプト、依存関係 |
| `tsconfig.json` | TypeScript のコンパイル設定。`src` をルートディレクトリとする |
| `esbuild.js` | `src/extension.ts` を `dist/extension.js` へバンドルする設定 |
| `eslint.config.mjs` | TypeScript 用 ESLint 設定 |
| `.vscode/launch.json` | 拡張機能ホストを起動するデバッグ設定 |
| `.vscode/tasks.json` | TypeScript と esbuild のウォッチタスク設定 |
| `README.md` | 利用者・開発者向けの説明 |
| `AGENTS_DOCS.md` | AI 向けの仕様書と設計意図 |
| `AGENTS.md` | AI 向けの作業指示書と運用ルール |

## 開発コマンド

リポジトリのルートで実行します。

```text
npm install       依存関係をインストール
npm run compile   型チェック、Lint、esbuild によるビルド
npm run check-types
                  TypeScript の型チェックのみ実行
npm run lint      src 配下の ESLint を実行
npm test          拡張機能テストをコンパイルして実行
npm run package   配布用の型チェック、Lint、プロダクションビルド
```

`npm run compile` の出力先は `dist/extension.js` です。テストのコンパイル先は `out` です。これらは生成物であり、ソースコードや仕様書の代わりに編集してはいけません。

## 開発時の確認方法

1. VS Code でリポジトリを開きます。
2. `F5` または「Run Extension」設定で拡張機能開発ホストを起動します。
3. コマンドパレットから `Hello World` を実行します。
4. 情報メッセージが表示されることを確認します。

表編集機能を実装した後は、上記の雛形確認に加えて、表の検出、セル編集、Markdown への書き戻し、異常な表記の扱いをテスト対象へ追加します。

## 今後の設計方針

表編集機能を追加する際は、少なくとも次の責務を分離して設計します。

- Markdown テーブルの構文解析と内部データモデルへの変換
- VS Code の対象ドキュメント・選択範囲と表の対応付け
- GUI の表示とユーザー入力の管理
- 編集結果の Markdown への安全な書き戻し
- パース不能な入力、セル内のパイプ、改行、配置記号などのエラー処理

具体的な UI 技術やデータモデルは、実装時点で既存コードと要件を確認して決定します。未実装の方針を実装済み仕様として README に記載してはいけません。

## ドキュメント更新の意図

環境構築直後は、VS Code の初期 README を残すよりも、現在できることとできないことを明示する方が、利用者と開発者の認識を揃えられます。そのため、README は初期テンプレートを削除し、現状の使い方と開発手順を中心に構成しています。また、AI が毎回全ファイルを調査しなくても変更方針を判断できるよう、実装状態と主要ファイルの責務をこの仕様書に集約しています。
