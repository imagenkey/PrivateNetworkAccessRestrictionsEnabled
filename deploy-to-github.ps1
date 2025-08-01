# GitHub Pages 簡単デプロイスクリプト
# ファイル名: deploy-to-github.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [switch]$CreateRepo
)

Write-Host "=== GitHub Pages デプロイスクリプト ===" -ForegroundColor Green
Write-Host "リポジトリ: $GitHubUsername/$RepoName" -ForegroundColor Cyan
Write-Host ""

# 現在のディレクトリがテストファイルの場所かチェック
if (-not (Test-Path "test-page.html")) {
    Write-Host "❌ エラー: test-page.html が見つかりません。" -ForegroundColor Red
    Write-Host "LocalNetworkAccessTest フォルダで実行してください。" -ForegroundColor Yellow
    exit 1
}

# Git初期化
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Gitリポジトリを初期化中..." -ForegroundColor Yellow
    git init
    
    # .gitignoreファイルの作成
    @"
# Windows
Thumbs.db
ehthumbs.db
Desktop.ini

# macOS
.DS_Store

# ログファイル
*.log

# 一時ファイル
*.tmp
*.temp
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    
    Write-Host "✅ Gitリポジトリを初期化しました。" -ForegroundColor Green
}

# README.mdの生成（GitHub Pages用）
$readmeContent = @"
# LocalNetworkAccessRestrictionsEnabled Policy Test

Microsoft EdgeのLocalNetworkAccessRestrictionsEnabledポリシーの動作を検証するテストページです。

## 🌐 ライブデモ

**重要**: このテストはパブリックWebサイトからのアクセスでのみ正確に動作します。

### テストページ
- **メインテスト**: [test-page.html](https://$GitHubUsername.github.io/$RepoName/test-page.html)
- **ネットワークスキャナー**: [network-scanner.html](https://$GitHubUsername.github.io/$RepoName/network-scanner.html)
- **ターゲットサービス**: [target-service.html](https://$GitHubUsername.github.io/$RepoName/target-service.html)

## 📋 使用方法

1. Microsoft Edgeでテストページにアクセス
2. F12でDevToolsを開く（コンソール・ネットワークタブを確認）
3. 各種テストボタンを実行
4. ポリシーの動作を確認

## 🛡️ ポリシー設定

Windows環境でのポリシー設定:
``````powershell
# ポリシー有効化
.\apply-policy.ps1 -Enable

# ポリシー無効化  
.\apply-policy.ps1 -Disable
``````

## 期待される動作

### ポリシー有効時
- ローカルネットワークアドレスへの要求が即座にブロック
- DevTools警告なし
- ネットワークエラーが発生

### ポリシー無効時
- DevTools警告表示
- 要求が継続される場合あり

---

**注意**: このテストツールは教育・検証目的のみで使用してください。
"@

$readmeContent | Out-File -FilePath "README.md" -Encoding UTF8

# ファイルをステージング
Write-Host "📁 ファイルをステージング中..." -ForegroundColor Yellow
git add .

# コミット
$commitMessage = "Add LocalNetworkAccessRestrictionsEnabled policy test files"
Write-Host "💾 コミット中: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

# リモートリポジトリの設定
$repoUrl = "https://github.com/$GitHubUsername/$RepoName.git"
Write-Host "🔗 リモートリポジトリを設定中: $repoUrl" -ForegroundColor Yellow

# 既存のorigin削除（存在する場合）
git remote remove origin 2>$null

git remote add origin $repoUrl

# メインブランチの設定
git branch -M main

Write-Host ""
Write-Host "📤 GitHubにプッシュしています..." -ForegroundColor Yellow
Write-Host "認証が必要な場合は、GitHubの認証情報を入力してください。" -ForegroundColor Cyan

try {
    git push -u origin main
    Write-Host "✅ GitHubへのプッシュが完了しました！" -ForegroundColor Green
} catch {
    Write-Host "❌ プッシュに失敗しました。" -ForegroundColor Red
    Write-Host "手動でリポジトリを作成してから再度実行してください。" -ForegroundColor Yellow
    Write-Host "GitHub URL: https://github.com/new" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🎉 デプロイ準備完了！" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "1. GitHub リポジトリにアクセス: https://github.com/$GitHubUsername/$RepoName"
Write-Host "2. Settings > Pages を開く"
Write-Host "3. Source を 'Deploy from a branch' に設定"
Write-Host "4. Branch を 'main' に設定"
Write-Host "5. Save をクリック"
Write-Host ""
Write-Host "数分後、以下のURLでアクセス可能になります:" -ForegroundColor Green
Write-Host "https://$GitHubUsername.github.io/$RepoName/test-page.html" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  重要: パブリックリポジトリとして公開されることに注意してください。" -ForegroundColor Yellow
