# Marketplace 公開・更新手順

この文書は、Markdown Table GUIをVisual Studio Marketplaceへ公開・更新する手順とリリース記録です。ユーザーによるGUI確認を経て、`1.0.0` を初回安定版として2026-08-11に公開しました。

## 現在の公開状態

- Marketplace: [Markdown Table GUI](https://marketplace.visualstudio.com/items?itemName=RyutaC2.markdown-table-gui)
- 拡張機能ID: `RyutaC2.markdown-table-gui`
- 公開バージョン: `1.0.0`
- 配布元VSIX: `artifacts/markdown-table-gui-1.0.0.vsix`
- SHA-256: `fd3e3e7da412826dbd7e5ac4771f59ce6f36db1e7a2d30609d696568997425bc`
- Gitタグ: `v1.0.0`

## 初回公開時の確認項目

- Marketplaceでpublisher `RyutaC2` を作成または所有確認し、拡張機能ID `RyutaC2.markdown-table-gui` を利用できることを管理画面で確認する
- GitHubリポジトリのSettings > Code securityでPrivate Vulnerability Reportingを有効にする
- `RELEASE_CHECKLIST.md` の8シナリオを実施し、公開条件を満たす
- Marketplace用の256×256 PNGアイコンが管理画面とVS Code内で意図した見た目になることを確認する
- 実際のLight/Darkテーマの画面を使ったスクリーンショットをREADMEへ追加するか判断する

名前とpublisherの利用可否は、最終的にMarketplaceの管理画面で確認してください。アイコンは `markdown_table_gui.png` をmanifestへ設定済みです。

## リリース候補を検証する

Node.js 22のクリーンな環境で次を実行します。

```bash
npm ci
npm run check-types
npm run lint
npm run test:unit
npm test
npm run test:web
npm run benchmark
npm run package:vsix
```

生成された `artifacts/markdown-table-gui-1.0.0.vsix` をVS Code Stableへインストールし、`RELEASE_CHECKLIST.md` の最終確認を行います。VSIXの内容にはアイコンPNGが含まれ、SVG原稿、ソース、テスト、秘密情報、内部文書、ソースマップが含まれていないことも確認します。

## v1を確定する

このリポジトリでは次のリリース準備を完了した状態で `1.0.0` を確定します。

1. `package.json` と `package-lock.json` を `1.0.0` へ更新する。
2. `CHANGELOG.md` に `1.0.0` の公開内容と日付を追加する。
3. `AGENTS_DOCS.md` とREADMEのバージョン表記・実装状態を確認する。
4. 全検証と `npm run package:vsix` を再実行する。
5. コミットとpush後、CIがすべて成功したことを確認する。

## Marketplaceへ公開・更新する

初回の `1.0.0` はトークンをリポジトリへ持ち込まないよう、次の手順で手動公開しました。今後も手動更新する場合は、対象バージョンのVSIXへ読み替えます。

1. [Visual Studio Marketplaceの管理画面](https://marketplace.visualstudio.com/manage)へMicrosoftアカウントでサインインする。
2. 左側でpublisher `RyutaC2` を選択する。存在しない場合だけ `Create publisher` から作成し、変更できないpublisher IDがmanifestの `RyutaC2` と一致することを確認する。
3. publisher画面の `New extension` から `Visual Studio Code` を選び、生成した `artifacts/markdown-table-gui-1.0.0.vsix` をアップロードする。
4. Marketplaceの検証結果を確認し、警告やエラーがあれば公開前に修正して同じバージョンを再生成する。受理済みのバージョン番号は再利用できないため、公開後の修正版はパッチバージョンを上げる。

公開後に次を確認してください。

- Marketplaceの名称、説明、README、ライセンス、リポジトリ、バージョンが正しい
- VS Code Stableから拡張機能IDを検索・インストールできる
- Desktop版とvscode.dev/github.devで有効化できる
- Gitタグを作成し、GitHub Releaseを作成する場合はMarketplaceへ公開したものと同じVSIXを添付する
- 公開Issueフォームと非公開の脆弱性報告フォームが利用できる

公式手順は[Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)と[Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)を参照してください。

## 認証情報と取り消し

- Marketplaceのトークン、資格情報、`.env` はリポジトリやVSIXへ保存しないでください。
- Microsoftは2026年12月1日にMarketplace公開用のグローバルPATを廃止予定です。継続的公開を自動化する場合は、公式ガイドに従ってMicrosoft Entra ID方式を採用してください。初回公開は手動アップロードでトークン保管を避けます。
- 公開直後に重大問題が見つかった場合は、まず非公開化または修正版の公開を検討します。拡張機能の削除は取り消せず、同じ名前を再利用できなくなるため、安易に実行しません。
