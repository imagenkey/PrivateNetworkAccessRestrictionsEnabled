# PowerShell Script: ポリシー適用スクリプト
# ファイル名: apply-policy.ps1

param(
    [switch]$Enable,
    [switch]$Disable,
    [switch]$Remove,
    [switch]$Force
)

Write-Host "=== LocalNetworkAccessRestrictionsEnabled ポリシー適用スクリプト ===" -ForegroundColor Green
Write-Host ""

# 管理者権限チェック
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ エラー: このスクリプトは管理者権限で実行する必要があります。" -ForegroundColor Red
    Write-Host "PowerShellを「管理者として実行」してから再度実行してください。" -ForegroundColor Yellow
    exit 1
}

# パラメータ検証
$actionCount = @($Enable, $Disable, $Remove).Where({$_}).Count
if ($actionCount -eq 0) {
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  ポリシー有効化: .\apply-policy.ps1 -Enable"
    Write-Host "  ポリシー無効化: .\apply-policy.ps1 -Disable"
    Write-Host "  ポリシー削除:   .\apply-policy.ps1 -Remove"
    Write-Host "  強制実行:       .\apply-policy.ps1 -Enable -Force"
    exit 1
}

if ($actionCount -gt 1) {
    Write-Host "❌ エラー: Enable, Disable, Remove のいずれか1つのみ指定してください。" -ForegroundColor Red
    exit 1
}

# レジストリパス定義
$policyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
$policyName = "LocalNetworkAccessRestrictionsEnabled"

# 現在の設定確認
function Get-CurrentPolicyValue {
    try {
        if (Test-Path $policyPath) {
            $value = Get-ItemProperty -Path $policyPath -Name $policyName -ErrorAction SilentlyContinue
            if ($null -ne $value.$policyName) {
                return $value.$policyName
            }
        }
        return $null
    } catch {
        return $null
    }
}

# 現在の設定表示
$currentValue = Get-CurrentPolicyValue
Write-Host "📋 現在の設定状況" -ForegroundColor Cyan
if ($null -eq $currentValue) {
    Write-Host "ポリシー設定: 未設定 (既定動作)" -ForegroundColor Gray
} else {
    $statusText = if ($currentValue -eq 1) { "有効 (ローカルネットワークアクセス制限あり)" } else { "無効 (制限なし)" }
    $color = if ($currentValue -eq 1) { "Red" } else { "Green" }
    Write-Host "ポリシー設定: $statusText" -ForegroundColor $color
}

Write-Host ""

# 確認プロンプト
if (-not $Force) {
    $action = if ($Enable) { "有効化 (値: 1)" } 
              elseif ($Disable) { "無効化 (値: 0)" } 
              else { "削除" }
    
    $confirmation = Read-Host "ポリシーを $action しますか？ (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "操作をキャンセルしました。" -ForegroundColor Yellow
        exit 0
    }
}

# レジストリ操作実行
try {
    Write-Host "🔧 ポリシー設定を変更中..." -ForegroundColor Yellow
    
    # レジストリキーの作成（存在しない場合）
    if (-not (Test-Path $policyPath)) {
        Write-Host "レジストリキーを作成中: $policyPath"
        New-Item -Path $policyPath -Force | Out-Null
    }
    
    if ($Enable) {
        Set-ItemProperty -Path $policyPath -Name $policyName -Value 1 -Type DWord
        Write-Host "✅ ポリシーを有効化しました。" -ForegroundColor Green
        Write-Host "   ローカルネットワークアクセスが制限されます。" -ForegroundColor Red
        
    } elseif ($Disable) {
        Set-ItemProperty -Path $policyPath -Name $policyName -Value 0 -Type DWord
        Write-Host "✅ ポリシーを無効化しました。" -ForegroundColor Green
        Write-Host "   ローカルネットワークアクセス制限が解除されます。" -ForegroundColor Green
        
    } elseif ($Remove) {
        Remove-ItemProperty -Path $policyPath -Name $policyName -ErrorAction SilentlyContinue
        Write-Host "✅ ポリシー設定を削除しました。" -ForegroundColor Green
        Write-Host "   既定の動作に戻ります。" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ ポリシー設定に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 設定後の確認
Write-Host ""
Write-Host "📋 設定後の状況確認" -ForegroundColor Cyan
$newValue = Get-CurrentPolicyValue

if ($null -eq $newValue) {
    Write-Host "ポリシー設定: 未設定 (既定動作)" -ForegroundColor Gray
} else {
    $statusText = if ($newValue -eq 1) { "有効 (ローカルネットワークアクセス制限あり)" } else { "無効 (制限なし)" }
    $color = if ($newValue -eq 1) { "Red" } else { "Green" }
    Write-Host "ポリシー設定: $statusText" -ForegroundColor $color
}

# Edge プロセス確認
$edgeProcesses = Get-Process -Name "msedge" -ErrorAction SilentlyContinue
if ($edgeProcesses) {
    Write-Host ""
    Write-Host "⚠️  重要: Microsoft Edge が実行中です。" -ForegroundColor Yellow
    Write-Host "ポリシー変更を反映するには、Edge を再起動する必要があります。" -ForegroundColor Yellow
    Write-Host ""
    
    $restartChoice = Read-Host "Edgeを再起動しますか？ (y/N)"
    if ($restartChoice -eq 'y' -or $restartChoice -eq 'Y') {
        Write-Host "🔄 Microsoft Edge を再起動中..." -ForegroundColor Yellow
        
        # Edge プロセスを停止
        $edgeProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
        
        # Edge を再起動
        try {
            $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
            if (-not (Test-Path $edgePath)) {
                $edgePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
            }
            
            if (Test-Path $edgePath) {
                Start-Process -FilePath $edgePath -ArgumentList "--new-window"
                Write-Host "✅ Microsoft Edge を再起動しました。" -ForegroundColor Green
            } else {
                Write-Host "❌ Edge の実行ファイルが見つかりません。手動で再起動してください。" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Edge の再起動に失敗しました。手動で再起動してください。" -ForegroundColor Red
        }
    }
}

# 次のステップ案内
Write-Host ""
Write-Host "💡 次のステップ" -ForegroundColor Cyan
Write-Host "1. Microsoft Edge を再起動（まだの場合）"
Write-Host "2. .\verify-policy.ps1 を実行してポリシー適用状況を確認"
Write-Host "3. test-page.html を開いてポリシー動作をテスト"
Write-Host "4. local-server.py を起動してローカルサーバーテストを実行"

Write-Host ""
Write-Host "ポリシー適用完了。" -ForegroundColor Green
