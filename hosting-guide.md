# LocalNetworkAccessRestrictionsEnabled テストページ ホスティングガイド

## 🎯 ホスティング場所の重要性

`LocalNetworkAccessRestrictionsEnabled`ポリシーは、**パブリックWebサイト**からローカルネットワークへのアクセスを制限するものです。そのため、テストページは必ずパブリックなWebサーバーにホストする必要があります。

## 📍 推奨ホスティング方法

### 1. 🌐 GitHub Pages（無料・推奨）

**最も簡単で効果的な方法**

#### 手順：
1. GitHubリポジトリを作成
2. テストファイルをアップロード
3. GitHub Pagesを有効化

#### 実装例：
```bash
# 新しいリポジトリを作成
git init
git add .
git commit -m "Add LocalNetworkAccess test files"
git remote add origin https://github.com/yourusername/edge-policy-test.git
git push -u origin main

# GitHub Pages設定
# Settings > Pages > Source: Deploy from a branch > main
```

**アクセスURL例**: `https://yourusername.github.io/edge-policy-test/test-page.html`

### 2. 🌍 Netlify（無料・高機能）

#### 手順：
1. [Netlify](https://netlify.com)にサインアップ
2. フォルダをドラッグ&ドロップでデプロイ
3. 自動的にHTTPS URLが生成

**特徴**：
- ドラッグ&ドロップで即座にデプロイ
- 自動HTTPS
- カスタムドメイン対応

### 3. ☁️ Vercel（無料・高速）

#### 手順：
1. [Vercel](https://vercel.com)にサインアップ
2. GitHub連携またはファイルアップロード
3. 自動デプロイ

### 4. 🔧 その他のパブリッククラウド

- **Azure Static Web Apps**
- **AWS S3 + CloudFront**
- **Firebase Hosting**
- **Surge.sh**

## ❌ 避けるべきホスティング場所

### ローカルホスト系（テスト不可）
```
❌ http://localhost:3000
❌ http://127.0.0.1:8080
❌ file:///C:/path/to/test-page.html
```

### プライベートネットワーク（テスト不可）
```
❌ http://192.168.1.100:8080
❌ http://10.0.0.50:3000
❌ 社内イントラネット
```

## 🚀 クイックセットアップ（GitHub Pages）

### Step 1: GitHubリポジトリ作成
