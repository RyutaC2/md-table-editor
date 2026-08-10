# Markdown Grid Editor

Markdown の表を、Visual Studio Code 内で Excel のように作成・編集する拡張機能です。

Markdown テーブルは、セル数が増えるほどパイプや区切り行の手入力・整形が難しくなります。Markdown Grid Editor はソースを左側、GUIグリッドを右側へ表示し、Markdown構文を直接整形しなくても表を編集できるようにします。

## 主な機能

- GFM Markdownテーブルの検出
- 表ごとのCodeLens `GUIで編集`
- Markdownエディターの右クリックメニューからGUI編集・新規テーブル挿入
- Desktop版とWeb版VS Codeに対応する仮想化グリッド
- セル、矩形範囲、不連続範囲、行、列の選択
- TSV形式のコピー、切り取り、貼り付けと貼り付け先の自動拡張
- 行列の追加、削除、ドラッグ移動
- 列の配置、安定ソート、ドラッグによる幅変更、全列の横幅調整
- 安全化したインラインMarkdown表示
- ソースとの即時同期、VS Code標準の保存とUndo/Redo
- 日本語・英語表示、light・dark・high contrastテーマ、ARIA grid

## 使い方

### 既存テーブルを編集する

1. VS CodeでMarkdownファイルを開きます。
2. 対象テーブルの直上に表示される `GUIで編集` を選択します。CodeLensを無効にしている場合は、テーブル内を右クリックして同じ操作を選択できます。
3. 左側にMarkdownソース、右側にGUIグリッドが表示されます。
4. セルの編集を確定すると、左側のソースへ直ちに反映されます。
5. ファイルは通常どおり Ctrl/Cmd+S で保存します。

### 新しいテーブルを挿入する

1. Markdownエディター内を右クリックし、`Markdownテーブルを挿入` を選択します。
2. QuickPickから1～8列・1～8行のサイズを選びます。行数にはヘッダー行を含みます。
3. 空のテーブルが挿入され、右側GUIの左上ヘッダーセルが編集状態で開きます。

カーソルが既存テーブル内にある場合は、そのテーブル全体の後へ新しいテーブルを挿入します。それ以外では、カーソルを含む行の後へ挿入します。

## 基本操作

| 操作 | キーまたはUI |
| --- | --- |
| セル移動 | 矢印キー |
| 範囲拡張 | Shift+矢印、Shift+クリック、ドラッグ |
| 不連続選択 | Ctrl/Cmd+クリック |
| 既存内容を編集 | Enter、F2、ダブルクリック |
| 内容を置換して編集 | 選択中に文字入力 |
| 編集確定 | Enter、Tab、フォーカス移動 |
| 編集破棄 | Esc |
| 内容をクリア | Delete、Backspace |
| 表全体を選択 | Ctrl/Cmd+A |
| コピー・切り取り・貼り付け | Ctrl/Cmd+C・X・V |
| Undo・Redo | Ctrl/Cmd+Z・Y、ツールバー |
| 行列の追加・削除 | 上部ツールバー |
| 配置・ソート | 各列見出しのメニュー |
| 列幅変更 | 列見出し右端をドラッグ |

不連続範囲のコピーは行いません。不連続選択中に貼り付けた場合は、主セルを開始位置として貼り付けます。

ツールバーは、履歴、行操作、列操作、表示操作の順にグループ化されています。各操作にはMaterial Symbolsのアイコンとラベルを表示し、画面幅が狭い場合はアイコンとツールチップへ自動的に切り替わります。列見出しのメニューからは配置とソートを実行できます。

## 対応するMarkdown

VS Code組み込みプレビューとGitHubの双方で表として解釈されるGFM Tableを対象とします。外側パイプ、空セル、配置、エスケープされたパイプ、一般的なインラインMarkdownを扱います。fenced code block内の表記は対象になりません。

GUIを開いただけではソースを書き換えません。列数が不均一なデータ行は、最初の編集操作を確定した時点で空セルを補って正規化します。

## 開発

### 必要な環境

- Visual Studio Code
- Node.js 22以上
- npm

```bash
npm install
npm run compile
```

| コマンド | 用途 |
| --- | --- |
| `npm run compile` | 型チェック、Lint、Desktop/Web/Webviewの開発ビルド |
| `npm run check-types` | TypeScriptの型チェック |
| `npm run lint` | ESLintの実行 |
| `npm run test:unit` | Markdown表の純粋ロジックを単体テスト |
| `npm test` | Desktop版の拡張機能統合テスト |
| `npm run test:web` | Web版の拡張機能統合テスト |
| `npm run package` | 配布用ビルド |
| `npm run package:vsix` | 配布用VSIXの生成 |
| `npm run watch` | TypeScriptとesbuildの監視ビルド |

VS Codeでこのリポジトリを開き、F5または `Run Extension` からExtension Development Hostを起動すると動作確認できます。

## 対応環境と制限

- VS Code `1.125.0` 以上
- Windows、macOS、Linux、vscode.dev、github.dev
- 50列×500行を性能保証対象とし、それを超える表も省略せず編集します。
- フィルター、数式、オートフィル、セル結合、複数行セル、raw HTML描画には対応していません。
- テレメトリーは収集しません。

## ライセンス

[MIT License](./LICENSE)

UIアイコンにはGoogle Material Symbols由来のSVGを使用しています。第三者ライセンスは [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) に記載しています。
