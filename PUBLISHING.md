# Marketplace 公開手順

この文書は、Markdown Grid EditorをVisual Studio Marketplaceへ初回公開するときの手順です。現在の `0.2.6` は公開候補版であり、`RELEASE_CHECKLIST.md` の受け入れ完了前に `1.0.0` へ変更しません。

## 公開前に人が決めること

- Marketplaceでpublisher `RyutaC2` を作成または所有確認し、拡張機能ID `RyutaC2.md-table-editor` を利用できることを管理画面で確認する
- GitHubリポジトリのSettings > Code securityでPrivate Vulnerability Reportingを有効にする
- `RELEASE_CHECKLIST.md` の8シナリオを実施し、公開条件を満たす
- Marketplace用アイコンを設定するか判断する。設定する場合は正方形のPNGを用意し、`package.json` の `icon` へ相対パスを指定する。256×256を推奨する
- 実際のLight/Darkテーマの画面を使ったスクリーンショットをREADMEへ追加するか判断する

名前とpublisherの利用可否は、最終的にMarketplaceの管理画面で確認してください。アイコンは必須項目ではありませんが、公開ページで拡張機能を識別しやすくするため、v1公開前の追加を推奨します。

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

生成された `artifacts/md-table-editor-0.2.6.vsix` をVS Code Stableへインストールし、`RELEASE_CHECKLIST.md` を完了します。VSIXの内容にはソース、テスト、秘密情報、内部文書、ソースマップが含まれていないことも確認します。

## v1を確定する

受け入れ完了後に、次を1つのリリース準備コミットとして行います。

1. `package.json` と `package-lock.json` を `1.0.0` へ更新する。
2. `CHANGELOG.md` に `1.0.0` の公開内容と日付を追加する。
3. `AGENTS_DOCS.md` とREADMEのバージョン表記・実装状態を確認する。
4. 全検証と `npm run package:vsix` を再実行する。
5. コミットとpush後、CIがすべて成功したことを確認する。

## Marketplaceへ公開する

初回は[Visual Studio Marketplaceの管理画面](https://marketplace.visualstudio.com/manage)から、生成した `artifacts/md-table-editor-1.0.0.vsix` を手動アップロードします。公開後に次を確認してください。

- Marketplaceの名称、説明、README、ライセンス、リポジトリ、バージョンが正しい
- VS Code Stableから拡張機能IDを検索・インストールできる
- Desktop版とvscode.dev/github.devで有効化できる
- 問題がなければGitタグ `v1.0.0` とGitHub Releaseを作成し、同じVSIXを添付する
- 公開Issueフォームと非公開の脆弱性報告フォームが利用できる

公式手順は[Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)と[Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)を参照してください。

## 認証情報と取り消し

- Marketplaceのトークン、資格情報、`.env` はリポジトリやVSIXへ保存しないでください。
- Microsoftは2026年12月1日にMarketplace公開用のグローバルPATを廃止予定です。継続的公開を自動化する場合は、公式ガイドに従ってMicrosoft Entra ID方式を採用してください。初回公開は手動アップロードでトークン保管を避けます。
- 公開直後に重大問題が見つかった場合は、まず非公開化または修正版の公開を検討します。拡張機能の削除は取り消せず、同じ名前を再利用できなくなるため、安易に実行しません。
