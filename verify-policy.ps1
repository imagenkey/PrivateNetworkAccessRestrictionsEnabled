# PowerShell Script: LocalNetworkAccessRestrictionsEnabled ポリシー確認
# ファイル名: verify-policy.ps1

param(
    [switch]$Detailed,
    [switch]$Export
)

Write-Host "=== LocalNetworkAccessRestrictionsEnabled ポリシー検証スクリプト ===" -ForegroundColor Green
Write-Host "実行時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# 管理者権限チェック
function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Microsoft Edge のバージョン確認
function Get-EdgeVersion {
    try {
        $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        if (-not (Test-Path $edgePath)) {
            $edgePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
        }
        
        if (Test-Path $edgePath) {
            $version = (Get-ItemProperty $edgePath).VersionInfo.ProductVersion
            return $version
        } else {
            return "インストールされていません"
        }
    } catch {
        return "バージョン取得失敗"
    }
}

# レジストリからポリシー設定を確認
function Get-PolicyFromRegistry {
    $policyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
    $policyName = "LocalNetworkAccessRestrictionsEnabled"
    
    try {
        if (Test-Path $policyPath) {
            $value = Get-ItemProperty -Path $policyPath -Name $policyName -ErrorAction SilentlyContinue
            if ($null -ne $value.$policyName) {
                return @{
                    Configured = $true
                    Value = $value.$policyName
                    Source = "マシンレジストリ"
                }
            }
        }
        
        # ユーザーレジストリもチェック
        $userPolicyPath = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
        if (Test-Path $userPolicyPath) {
            $value = Get-ItemProperty -Path $userPolicyPath -Name $policyName -ErrorAction SilentlyContinue
            if ($null -ne $value.$policyName) {
                return @{
                    Configured = $true
                    Value = $value.$policyName
                    Source = "ユーザーレジストリ"
                }
            }
        }
        
        return @{
            Configured = $false
            Value = $null
            Source = "未設定"
        }
    } catch {
        return @{
            Configured = $false
            Value = $null
            Source = "エラー: $($_.Exception.Message)"
        }
    }
}

# グループポリシー設定確認
function Get-GroupPolicyStatus {
    try {
        $gpResult = gpresult /r /scope:computer 2>$null
        if ($LASTEXITCODE -eq 0) {
            return "適用済み"
        } else {
            return "確認失敗"
        }
    } catch {
        return "確認不可"
    }
}

# Edge プロセスの実行状況確認
function Get-EdgeProcessStatus {
    $edgeProcesses = Get-Process -Name "msedge" -ErrorAction SilentlyContinue
    if ($edgeProcesses) {
        return @{
            Running = $true
            ProcessCount = $edgeProcesses.Count
            StartTimes = $edgeProcesses | ForEach-Object { $_.StartTime }
        }
    } else {
        return @{
            Running = $false
            ProcessCount = 0
            StartTimes = @()
        }
    }
}

# ネットワーク接続テスト
function Test-LocalNetworkConnectivity {
    $testTargets = @(
        "127.0.0.1",
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1"
    )
    
    $results = @()
    foreach ($target in $testTargets) {
        try {
            $pingResult = Test-Connection -ComputerName $target -Count 1 -Quiet -TimeoutSeconds 2
            $results += @{
                Target = $target
                Reachable = $pingResult
                Description = switch ($target) {
                    "127.0.0.1" { "ローカルホスト" }
                    "192.168.1.1" { "一般的なルーター (Class C)" }
                    "10.0.0.1" { "一般的なルーター (Class A)" }
                    "172.16.0.1" { "一般的なルーター (Class B)" }
                }
            }
        } catch {
            $results += @{
                Target = $target
                Reachable = $false
                Description = "テスト失敗"
            }
        }
    }
    
    return $results
}

# メイン実行部分
Write-Host "🔍 システム情報確認" -ForegroundColor Yellow
Write-Host "管理者権限: $(if (Test-AdminRights) { '✅ あり' } else { '❌ なし' })"
Write-Host "Microsoft Edge バージョン: $(Get-EdgeVersion)"

$edgeVersion = Get-EdgeVersion
if ($edgeVersion -eq "インストールされていません") {
    Write-Host "❌ Microsoft Edge がインストールされていません。" -ForegroundColor Red
    exit 1
}

# バージョン138以上かチェック
try {
    $versionNumber = [version]$edgeVersion.Split('.')[0..3] -join '.'
    $minimumVersion = [version]"138.0.0.0"
    
    if ($versionNumber -lt $minimumVersion) {
        Write-Host "⚠️  警告: 現在のEdgeバージョン ($edgeVersion) はポリシーサポート対象外です。" -ForegroundColor Yellow
        Write-Host "   最小要件: バージョン 138以降" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Edgeバージョンはポリシーサポート対象です。" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  バージョン比較に失敗しました。" -ForegroundColor Yellow
}

Write-Host ""

# ポリシー設定確認
Write-Host "🛡️  ポリシー設定確認" -ForegroundColor Yellow
$policyStatus = Get-PolicyFromRegistry

Write-Host "設定状況: $($policyStatus.Source)"
if ($policyStatus.Configured) {
    $statusText = if ($policyStatus.Value -eq 1) { "有効 (ローカルネットワークアクセス制限あり)" } else { "無効 (制限なし)" }
    $color = if ($policyStatus.Value -eq 1) { "Red" } else { "Green" }
    Write-Host "ポリシー値: $statusText" -ForegroundColor $color
} else {
    Write-Host "ポリシー値: 未設定 (既定動作)" -ForegroundColor Gray
}

Write-Host ""

# Edge プロセス確認
Write-Host "🌐 Microsoft Edge プロセス確認" -ForegroundColor Yellow
$edgeStatus = Get-EdgeProcessStatus

if ($edgeStatus.Running) {
    Write-Host "Edge状態: ✅ 実行中 ($($edgeStatus.ProcessCount) プロセス)"
    if ($Detailed) {
        Write-Host "開始時刻:" -ForegroundColor Gray
        $edgeStatus.StartTimes | ForEach-Object { 
            Write-Host "  - $($_.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "Edge状態: ❌ 実行されていません"
}

Write-Host ""

# ネットワーク接続テスト
if ($Detailed) {
    Write-Host "🔗 ローカルネットワーク接続テスト" -ForegroundColor Yellow
    $networkTests = Test-LocalNetworkConnectivity
    
    foreach ($test in $networkTests) {
        $symbol = if ($test.Reachable) { "✅" } else { "❌" }
        Write-Host "$symbol $($test.Target) - $($test.Description)"
    }
    Write-Host ""
}

# グループポリシー確認
Write-Host "📋 グループポリシー状況" -ForegroundColor Yellow
$gpStatus = Get-GroupPolicyStatus
Write-Host "グループポリシー: $gpStatus"

Write-Host ""

# 推奨アクション
Write-Host "💡 推奨アクション" -ForegroundColor Cyan
if ($policyStatus.Configured) {
    if ($policyStatus.Value -eq 1) {
        Write-Host "1. test-page.html を開いてローカルネットワークアクセスがブロックされることを確認"
        Write-Host "2. DevTools でエラーメッセージを確認"
        Write-Host "3. ポリシーを無効化してテストを再実行"
    } else {
        Write-Host "1. test-page.html を開いてローカルネットワークアクセスが成功することを確認"
        Write-Host "2. ポリシーを有効化してブロック動作をテスト"
    }
} else {
    Write-Host "1. policy-settings.reg を使用してポリシーを設定"
    Write-Host "2. Edge を再起動してポリシーを適用"
    Write-Host "3. test-page.html でテストを実行"
}

Write-Host "4. local-server.py を起動してローカルテストサーバーを準備"
Write-Host "5. 複数のプライベートIPアドレスでテストを実行"

# 結果のエクスポート
if ($Export) {
    $exportData = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        EdgeVersion = $edgeVersion
        PolicyStatus = $policyStatus
        EdgeProcesses = $edgeStatus
        AdminRights = Test-AdminRights
        GroupPolicy = $gpStatus
    }
    
    if ($Detailed) {
        $exportData.NetworkTests = Test-LocalNetworkConnectivity
    }
    
    $exportPath = "policy-verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $exportData | ConvertTo-Json -Depth 3 | Out-File -FilePath $exportPath -Encoding UTF8
    Write-Host ""
    Write-Host "📄 検証結果を $exportPath にエクスポートしました。" -ForegroundColor Green
}

Write-Host ""
Write-Host "検証完了。" -ForegroundColor Green
