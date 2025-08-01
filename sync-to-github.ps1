# LocalNetworkAccessRestrictionsEnabled 全ファイル Git管理スクリプト
# ファイル名: sync-to-github.ps1

param(
    [string]$CommitMessage = "Update LocalNetworkAccessRestrictionsEnabled test files"
)

Write-Host "=== LocalNetworkAccessRestrictionsEnabled Git同期スクリプト ===" -ForegroundColor Green
Write-Host "実行時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# 現在のディレクトリがテストファイルの場所かチェック
if (-not (Test-Path "test-page.html")) {
    Write-Host "❌ エラー: test-page.html が見つかりません。" -ForegroundColor Red
    Write-Host "LocalNetworkAccessTest フォルダで実行してください。" -ForegroundColor Yellow
    exit 1
}

# Git初期化確認
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Gitリポジトリを初期化中..." -ForegroundColor Yellow
    git init
}

# .gitignoreファイルの作成・更新
Write-Host "📄 .gitignoreファイルを作成中..." -ForegroundColor Yellow
$gitignoreContent = @"
# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# macOS
.DS_Store
.AppleDouble
.LSOverride

# ログファイル
*.log
*.tmp
*.temp

# エディタ設定
.vscode/
.idea/

# ノード関連（将来の拡張用）
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 個人設定ファイル
config.local.*
"@

$gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8

# README.mdの生成・更新
Write-Host "📝 README.mdを生成中..." -ForegroundColor Yellow
$readmeContent = @"
# LocalNetworkAccessRestrictionsEnabled Policy Test

Microsoft EdgeのLocalNetworkAccessRestrictionsEnabledポリシーの動作を検証するための包括的なテストツールセットです。

## 🌐 ライブデモ

**重要**: このテストはパブリックWebサイトからのアクセスでのみ正確に動作します。

### 🎯 テストページ一覧
- **[メインテストページ](https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/test-page.html)** - 基本的なポリシー動作検証
- **[ネットワークスキャナー](https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/network-scanner.html)** - 高度なネットワークスキャン機能
- **[ターゲットサービス](https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/target-service.html)** - アクセス対象ローカルサービス

## 📋 ファイル構成

### 🌐 Webテストページ
- **test-page.html** - メインテストページ（基本機能）
- **network-scanner.html** - 高度なネットワークスキャン機能
- **target-service.html** - ローカルサービス模擬ページ

### 🔧 JavaScriptライブラリ
- **local-request-test.js** - テスト用JavaScriptライブラリ

### ⚙️ ポリシー設定ファイル
- **policy-settings.reg** - Windowsレジストリ設定
- **policy-settings.json** - ポリシー設定情報（JSON）

### 🐍 ローカルサーバー
- **local-server.py** - テスト用HTTPサーバー

### 🛠️ PowerShellスクリプト
- **verify-policy.ps1** - ポリシー適用状況確認
- **apply-policy.ps1** - ポリシー設定適用
- **test-runner.ps1** - 総合テスト実行
- **deploy-to-github.ps1** - GitHub Pagesデプロイ支援
- **sync-to-github.ps1** - Git同期スクリプト

### 📚 ドキュメント
- **README.md** - プロジェクト概要（このファイル）
- **group-policy-guide.md** - グループポリシー設定ガイド
- **hosting-guide.md** - ホスティング方法ガイド

## 🚀 使用方法

### 1. 🌐 Webテストの実行
1. Microsoft Edgeで[メインテストページ](https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/test-page.html)にアクセス
2. F12でDevToolsを開く（コンソール・ネットワークタブを確認）
3. 各種テストボタンを実行
4. ポリシーの動作を確認

### 2. ⚙️ ローカル環境でのポリシー設定

#### Windows環境での設定:
\`\`\`powershell
# 管理者権限でPowerShellを実行

# ポリシー有効化
.\apply-policy.ps1 -Enable

# ポリシー無効化  
.\apply-policy.ps1 -Disable

# ポリシー状態確認
.\verify-policy.ps1 -Detailed
\`\`\`

### 3. 🔬 総合テストの実行
\`\`\`powershell
# 自動テスト実行
.\test-runner.ps1 -AutoApplyPolicy

# ローカルサーバー起動
python local-server.py
\`\`\`

## 🛡️ ポリシーについて

### LocalNetworkAccessRestrictionsEnabled とは
Microsoft Edge 138以降で利用可能なポリシーで、パブリックWebサイトがローカルネットワーク上のデバイスに要求を行うことを制限します。

### 期待される動作

#### 🔒 ポリシー有効時
- ローカルネットワークアドレスへの要求が即座にブロック
- DevTools警告なし
- ネットワークエラーが発生
- セキュリティ向上

#### 🔓 ポリシー無効時
- DevTools警告表示
- 要求が継続される場合あり
- ユーザー判断による制御

## 🎯 対象IPアドレス範囲

テストでは以下のプライベートIPアドレス範囲をスキャンします：

- **127.0.0.1** - ローカルホスト
- **10.0.0.0/8** - Class A プライベート
- **172.16.0.0/12** - Class B プライベート  
- **192.168.0.0/16** - Class C プライベート
- **169.254.0.0/16** - リンクローカル

## 📊 テスト機能

### 基本テスト機能
- 個別IPアドレステスト
- 一括ネットワークスキャン
- プライベートIP範囲スキャン
- サービスポートスキャン

### 高度なスキャン機能（network-scanner.html）
- 並行度制御可能なスキャン
- リアルタイム結果表示
- 詳細統計情報
- 結果エクスポート機能

## 🔧 開発環境

### 要件
- **Microsoft Edge 138+** - ポリシーサポートのため
- **Windows 10/11** - レジストリポリシー設定用
- **Python 3.x** - ローカルサーバー用（オプション）
- **PowerShell 5.0+** - 管理スクリプト用

### ローカル開発
\`\`\`bash
# リポジトリクローン
git clone https://github.com/imagenkey/PrivateNetworkAccessRestrictionsEnabled.git
cd PrivateNetworkAccessRestrictionsEnabled

# ローカルサーバー起動
python local-server.py

# ブラウザでファイルアクセス
# file:// ではなく http:// でアクセスすること
\`\`\`

## ⚠️ 注意事項

### セキュリティ
- このツールは**教育・検証目的のみ**で使用してください
- 本番環境での不正なネットワークスキャンは禁止されています
- 組織のセキュリティポリシーに従って使用してください

### テスト環境
- パブリックWebサイトからのアクセスでのみ正確な動作確認が可能
- ローカルファイル（file://）では制限が適用されません
- プライベートネットワークからのテストでは正確な結果が得られない場合があります

## 📚 関連リソース

### Microsoft 公式ドキュメント
- [Microsoft Edge ポリシー リファレンス](https://docs.microsoft.com/ja-jp/deployedge/microsoft-edge-policies)
- [LocalNetworkAccessRestrictionsEnabled](https://docs.microsoft.com/ja-jp/deployedge/microsoft-edge-browser-policies/localnetworkaccessrestrictionsenabled)

### 技術仕様
- **サポートバージョン**: Microsoft Edge 138以降
- **対応OS**: Windows, macOS
- **ポリシータイプ**: マシンポリシー（必須設定可能）

## 🤝 貢献

プロジェクトへの貢献を歓迎します：

1. このリポジトリをフォーク
2. 機能ブランチを作成 (\`git checkout -b feature/amazing-feature\`)
3. 変更をコミット (\`git commit -m 'Add amazing feature'\`)
4. ブランチにプッシュ (\`git push origin feature/amazing-feature\`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

---

**作成者**: imagenkey  
**更新日**: $(Get-Date -Format 'yyyy年MM月dd日')  
**目的**: Microsoft Edge LocalNetworkAccessRestrictionsEnabled ポリシーの動作検証
"@

$readmeContent | Out-File -FilePath "README.md" -Encoding UTF8

# 現在のファイル一覧を表示
Write-Host "📁 管理対象ファイル一覧:" -ForegroundColor Cyan
$files = Get-ChildItem -File | Where-Object { $_.Name -notlike ".*" -and $_.Name -ne "sync-to-github.ps1" }
$files | ForEach-Object {
    $size = if ($_.Length -lt 1KB) { "$($_.Length) B" }
           elseif ($_.Length -lt 1MB) { "{0:F1} KB" -f ($_.Length / 1KB) }
           else { "{0:F1} MB" -f ($_.Length / 1MB) }
    
    Write-Host "  📄 $($_.Name) ($size)" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 合計: $($files.Count) ファイル" -ForegroundColor Green

# ファイルをステージング
Write-Host ""
Write-Host "📦 ファイルをステージング中..." -ForegroundColor Yellow
git add .

# 変更があるかチェック
$hasChanges = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    # 変更がある場合
    Write-Host "💾 変更をコミット中..." -ForegroundColor Yellow
    git commit -m $CommitMessage
    
    Write-Host "📤 GitHubにプッシュ中..." -ForegroundColor Yellow
    try {
        git push origin main
        Write-Host ""
        Write-Host "✅ Git同期が完了しました！" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 アクセス可能なURL:" -ForegroundColor Cyan
        Write-Host "  メインテスト: https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/test-page.html" -ForegroundColor White
        Write-Host "  スキャナー:   https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/network-scanner.html" -ForegroundColor White
        Write-Host "  ターゲット:   https://imagenkey.github.io/PrivateNetworkAccessRestrictionsEnabled/target-service.html" -ForegroundColor White
        
    } catch {
        Write-Host "❌ プッシュに失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "手動でプッシュしてください: git push origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host "📋 変更がありません。すべてのファイルは最新です。" -ForegroundColor Green
}

Write-Host ""
Write-Host "📈 Git状態:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "🎉 Git管理セットアップ完了！" -ForegroundColor Green
