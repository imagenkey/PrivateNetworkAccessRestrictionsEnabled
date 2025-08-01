# LocalNetworkAccessRestrictionsEnabled グループポリシー設定ガイド

このドキュメントでは、`LocalNetworkAccessRestrictionsEnabled`ポリシーをグループポリシー管理コンソール（GPMC）で設定する方法について説明します。

## 📋 事前要件

### システム要件
- Windows 10/11 Pro、Enterprise、または Education エディション
- Microsoft Edge バージョン 138 以降
- Active Directory 環境（ドメイン設定の場合）
- 管理者権限

### 必要なファイル
- `MSEdge.admx` (Microsoft Edge 管理用テンプレート)
- `MSEdge.adml` (言語固有のリソースファイル)

## 🛠️ グループポリシー設定手順

### 1. 管理用テンプレートの準備

#### ADMXファイルの取得
Microsoft Edge の最新 ADMX ファイルを以下から取得します：
- [Microsoft Edge Enterprise](https://www.microsoft.com/en-us/edge/business/download)
- [Microsoft Edge 管理用テンプレート](https://docs.microsoft.com/en-us/deployedge/configure-microsoft-edge)

#### ファイルの配置
```
# ローカルコンピューター用
C:\Windows\PolicyDefinitions\MSEdge.admx
C:\Windows\PolicyDefinitions\ja-JP\MSEdge.adml

# ドメイン環境用（セントラルストア）
\\<domain>\SYSVOL\<domain>\Policies\PolicyDefinitions\MSEdge.admx
\\<domain>\SYSVOL\<domain>\Policies\PolicyDefinitions\ja-JP\MSEdge.adml
```

### 2. グループポリシー管理コンソールでの設定

#### GPMCの起動
1. `gpedit.msc` (ローカル) または `gpmc.msc` (ドメイン) を実行
2. 適切なGPOを選択または新規作成

#### ポリシー設定の場所
```
コンピューターの構成
  └── 管理用テンプレート
      └── Microsoft Edge
          └── ネットワーク設定
              └── パブリック Web サイトからユーザーのローカル ネットワーク上のデバイスへの要求をブロックするかどうかを指定します。
```

#### 設定値
- **有効**: ローカルネットワークアクセスを制限
- **無効**: ローカルネットワークアクセスを許可
- **未構成**: 既定の動作（通常は警告表示）

### 3. 設定の詳細情報

#### レジストリ情報
- **キー**: `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge`
- **値名**: `LocalNetworkAccessRestrictionsEnabled`
- **データ型**: `REG_DWORD`
- **値**: 
  - `1` (有効)
  - `0` (無効)

#### ADMXテンプレート詳細
```xml
<policy name="LocalNetworkAccessRestrictionsEnabled" 
        class="Machine" 
        displayName="$(string.LocalNetworkAccessRestrictionsEnabled)" 
        explainText="$(string.LocalNetworkAccessRestrictionsEnabled_Explain)" 
        key="Software\Policies\Microsoft\Edge" 
        valueName="LocalNetworkAccessRestrictionsEnabled">
  <parentCategory ref="Network"/>
  <supportedOn ref="SUPPORTED_WIN7"/>
  <enabledValue>
    <decimal value="1"/>
  </enabledValue>
  <disabledValue>
    <decimal value="0"/>
  </disabledValue>
</policy>
```

## 🎯 適用とテスト

### ポリシーの適用
1. **ローカル環境**:
   ```powershell
   gpupdate /force
   ```

2. **ドメイン環境**:
   ```powershell
   # クライアントで実行
   gpupdate /force
   
   # または再ログイン/再起動で自動適用
   ```

### 適用状況の確認
```powershell
# ポリシー適用状況確認
gpresult /r

# 詳細なレポート生成
gpresult /h report.html

# 特定ポリシーの確認
gpresult /scope computer /v | findstr "LocalNetworkAccessRestrictionsEnabled"
```

### レジストリでの確認
```powershell
# PowerShellで確認
Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Name "LocalNetworkAccessRestrictionsEnabled"

# コマンドプロンプトで確認
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v LocalNetworkAccessRestrictionsEnabled
```

## 🔍 トラブルシューティング

### よくある問題と解決策

#### 1. ポリシーが表示されない
**原因**: ADMX/ADMLファイルが正しく配置されていない
**解決策**:
- ファイルの配置場所を確認
- グループポリシー管理コンソールを再起動
- セントラルストアの使用を確認

#### 2. ポリシーが適用されない
**原因**: ポリシーの適用範囲やタイミングの問題
**解決策**:
```powershell
# 強制的なポリシー更新
gpupdate /force

# Microsoft Edge プロセスの再起動
taskkill /f /im msedge.exe
```

#### 3. Edge バージョンが古い
**原因**: サポート対象外のEdgeバージョン
**解決策**:
- Microsoft Edge を最新バージョンに更新
- バージョン 138 以降であることを確認

### 診断コマンド
```powershell
# Edge バージョン確認
(Get-ItemProperty "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe").VersionInfo.ProductVersion

# 適用されているポリシー一覧
Get-ChildItem "HKLM:\SOFTWARE\Policies\Microsoft\Edge"

# グループポリシー診断
gpresult /r /scope:computer
```

## 📊 組織的な展開

### 段階的展開の推奨事項

#### フェーズ 1: パイロットテスト
- 限定されたテストグループでの検証
- 影響範囲の確認
- 例外要件の特定

#### フェーズ 2: 部門別展開
- 部門ごとの段階的適用
- ユーザーサポートの準備
- 問題対応手順の確立

#### フェーズ 3: 全社展開
- 全組織への適用
- 監視とレポート体制の確立
- 継続的な評価と調整

### 監視とレポート

#### 適用状況レポート
```powershell
# 組織全体の適用状況確認スクリプト例
$computers = Get-ADComputer -Filter * -Property Name
$results = @()

foreach ($computer in $computers) {
    try {
        $regValue = Invoke-Command -ComputerName $computer.Name -ScriptBlock {
            Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -Name "LocalNetworkAccessRestrictionsEnabled" -ErrorAction SilentlyContinue
        }
        
        $results += [PSCustomObject]@{
            ComputerName = $computer.Name
            PolicyValue = $regValue.LocalNetworkAccessRestrictionsEnabled
            Status = if ($regValue) { "適用済み" } else { "未適用" }
        }
    } catch {
        $results += [PSCustomObject]@{
            ComputerName = $computer.Name
            PolicyValue = $null
            Status = "確認失敗"
        }
    }
}

$results | Export-Csv -Path "PolicyDeploymentReport.csv" -NoTypeInformation
```

## 🛡️ セキュリティ考慮事項

### ポリシー有効化による影響
- **保護される脅威**: ローカルネットワークスキャン、内部サービスへの不正アクセス
- **制限される機能**: 正当なローカル開発サーバーへのアクセス
- **ユーザー体験**: 一部のイントラネットアプリケーションの動作に影響

### 例外管理
特定のサイトやアプリケーションで例外が必要な場合:
1. `LocalNetworkAccessRestrictionsEnabled` を無効にする
2. 別のセキュリティ制御を実装する
3. ユーザー教育とトレーニングを実施する

## 📚 関連リソース

### Microsoft 公式ドキュメント
- [Microsoft Edge ポリシー リファレンス](https://docs.microsoft.com/en-us/deployedge/microsoft-edge-policies)
- [Microsoft Edge 管理ガイド](https://docs.microsoft.com/en-us/deployedge/)
- [グループポリシー管理](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/)

### 追加ツール
- [Microsoft Edge 管理ツールキット](https://www.microsoft.com/en-us/edge/business/download)
- [グループポリシー管理コンソール](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/dn265982(v=ws.11))

---

このガイドを参考にして、組織のセキュリティ要件に応じた適切なポリシー設定を実施してください。
