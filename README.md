# Markdown Grid Editor

Markdown の表を、Visual Studio Code 内で Excel のように編集するための拡張機能です。

Markdown テーブルは、セル数が増えるほどパイプや区切り行の手入力・整形が難しくなります。Markdown Grid Editor はソースを左側、GUIグリッドを右側へ表示し、表を視覚的に作成・編集できるようにします。

## 開発状態

現在は要件定義が完了し、初回リリース `0.1.0` を実装中です。Desktop/Web用のビルド、React Webview、日英ローカライズ、VSIX生成の基盤を整備しています。以下の操作は、各機能の実装完了まで利用できません。

## 初回リリースで提供する操作

- 各 Markdown テーブルの直上に表示される `GUIで編集` から編集画面を開く
- Markdown エディターの右クリックメニューから新しい表を挿入する
- 左側の Markdown ソースと右側の GUI を同時に表示する
- セル、複数セル、行、列をキーボードとマウスで選択・編集する
- TSV形式でコピー、切り取り、貼り付けを行う
- 行列の追加、削除、並べ替え、配置、ソート、列幅調整を行う
- 編集確定時にソースへ反映し、通常の Ctrl/Cmd+S でファイルを保存する
- VS Code 標準の Undo/Redo を利用する

Desktop版 VS Codeに加え、vscode.devとgithub.devを含むWeb版 VS Codeにも対応します。表示言語は日本語と英語です。

## 対応するMarkdown

VS Code 組み込みプレビューと GitHub の双方で表として解釈される GFM Table を対象とします。外側パイプ、空セル、配置、エスケープされたパイプ、一般的なインラインMarkdownを扱います。コードブロック内の表記は編集対象になりません。

## 開発環境

### 必要な環境

- Visual Studio Code
- Node.js
- npm

### セットアップ

```bash
npm install
npm run compile
```

### 開発用コマンド

| コマンド | 用途 |
| --- | --- |
| `npm run compile` | 型チェック、Lint、開発用ビルド |
| `npm run check-types` | TypeScriptの型チェック |
| `npm run lint` | ESLintの実行 |
| `npm test` | 拡張機能テストの実行 |
| `npm run package` | 配布用ビルド |
| `npm run package:vsix` | 配布用VSIXの生成 |
| `npm run watch` | TypeScriptとesbuildの監視ビルド |

## 初回リリースの対象外

フィルター、数式、オートフィル、セル結合、複数行セル、raw HTMLの描画は初回リリースに含みません。Marketplaceへの公開とアイコン作成も、このリポジトリでの初回実装作業には含みません。

## ライセンス

MIT Licenseで公開する予定です。
