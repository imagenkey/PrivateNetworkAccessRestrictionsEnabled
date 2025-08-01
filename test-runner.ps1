# PowerShell Script: LocalNetworkAccessRestrictionsEnabled 総合テストランナー
# ファイル名: test-runner.ps1

param(
    [switch]$SkipPolicyCheck,
    [switch]$SkipServerStart,
    [switch]$AutoApplyPolicy,
    [string]$TestMode = "both" # "enabled", "disabled", "both"
)

$ErrorActionPreference = "Continue"

Write-Host "=== LocalNetworkAccessRestrictionsEnabled 総合テストランナー ===" -ForegroundColor Green
Write-Host "開始時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# テスト設定
$testConfig = @{
    ServerPort = 8080
    TestDuration = 30
    TestUrls = @(
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.1.1:80",
        "http://10.0.0.1:80",
        "http://172.16.0.1:80"
    )
}

# ポリシー適用関数
function Set-LocalNetworkPolicy {
    param([bool]$Enable)
    
    $regPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
    $regName = "LocalNetworkAccessRestrictionsEnabled"
    $regValue = if ($Enable) { 1 } else { 0 }
    
    try {
        if (-not (Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }
        
        Set-ItemProperty -Path $regPath -Name $regName -Value $regValue -Type DWord
        Write-Host "✅ ポリシーを $(if ($Enable) { '有効' } else { '無効' }) に設定しました。" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ ポリシー設定に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# サーバー起動関数
function Start-TestServer {
    param([int]$Port = 8080)
    
    Write-Host "🚀 テストサーバーを起動しています (ポート: $Port)..." -ForegroundColor Yellow
    
    try {
        $pythonCommand = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } 
                        elseif (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" }
                        else { $null }
        
        if (-not $pythonCommand) {
            Write-Host "❌ Python が見つかりません。local-server.py を手動で起動してください。" -ForegroundColor Red
            return $null
        }
        
        $serverScript = Join-Path $PSScriptRoot "local-server.py"
        if (-not (Test-Path $serverScript)) {
            Write-Host "❌ local-server.py が見つかりません。" -ForegroundColor Red
            return $null
        }
        
        $serverProcess = Start-Process -FilePath $pythonCommand -ArgumentList $serverScript,$Port -WindowStyle Minimized -PassThru
        
        # サーバー起動待機
        Start-Sleep -Seconds 3
        
        # サーバーの応答確認
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 5 -UseBasicParsing
            Write-Host "✅ テストサーバーが正常に起動しました。" -ForegroundColor Green
            return $serverProcess
        } catch {
            Write-Host "⚠️  サーバーは起動していますが、応答確認に失敗しました。" -ForegroundColor Yellow
            return $serverProcess
        }
        
    } catch {
        Write-Host "❌ サーバー起動に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Edge プロセス再起動関数
function Restart-EdgeBrowser {
    Write-Host "🔄 Microsoft Edge を再起動しています..." -ForegroundColor Yellow
    
    # 既存の Edge プロセスを停止
    $edgeProcesses = Get-Process -Name "msedge" -ErrorAction SilentlyContinue
    if ($edgeProcesses) {
        Write-Host "   既存の Edge プロセスを終了中..."
        $edgeProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    
    # Edge を新しく起動
    try {
        $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        if (-not (Test-Path $edgePath)) {
            $edgePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
        }
        
        if (Test-Path $edgePath) {
            Start-Process -FilePath $edgePath -ArgumentList "--new-window" -WindowStyle Normal
            Write-Host "✅ Microsoft Edge を起動しました。" -ForegroundColor Green
            Start-Sleep -Seconds 3
            return $true
        } else {
            Write-Host "❌ Microsoft Edge の実行ファイルが見つかりません。" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Edge の起動に失敗しました: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ネットワークアクセステスト関数
function Test-NetworkAccess {
    param([string[]]$TestUrls, [string]$TestName)
    
    Write-Host "🔍 ネットワークアクセステスト実行中: $TestName" -ForegroundColor Yellow
    
    $results = @()
    foreach ($url in $TestUrls) {
        Write-Host "   テスト中: $url" -ForegroundColor Gray
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            $stopwatch.Stop()
            
            $results += @{
                Url = $url
                Success = $true
                StatusCode = $response.StatusCode
                ResponseTime = $stopwatch.ElapsedMilliseconds
                Error = $null
            }
            
            Write-Host "     ✅ 成功 ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
            
        } catch {
            $stopwatch.Stop()
            
            $results += @{
                Url = $url
                Success = $false
                StatusCode = $null
                ResponseTime = $stopwatch.ElapsedMilliseconds
                Error = $_.Exception.Message
            }
            
            Write-Host "     ❌ 失敗 ($($stopwatch.ElapsedMilliseconds)ms): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    return $results
}

# テストレポート生成関数
function Generate-TestReport {
    param($EnabledResults, $DisabledResults, $TestConfig)
    
    $reportPath = "test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    
    $html = @"
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalNetworkAccessRestrictionsEnabled テストレポート</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        h1, h2 { color: #0078d4; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: #4caf50; font-weight: bold; }
        .error { color: #f44336; font-weight: bold; }
        .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <h1>LocalNetworkAccessRestrictionsEnabled テストレポート</h1>
    <div class="timestamp">生成日時: $(Get-Date -Format 'yyyy年MM月dd日 HH:mm:ss')</div>
    
    <div class="summary">
        <h2>📋 テスト概要</h2>
        <p><strong>テスト対象:</strong> LocalNetworkAccessRestrictionsEnabled ポリシー</p>
        <p><strong>テストURL数:</strong> $($TestConfig.TestUrls.Count)</p>
        <p><strong>テスト設定:</strong> ポリシー有効時と無効時の動作比較</p>
    </div>
"@

    if ($EnabledResults) {
        $html += @"
    <h2>🔒 ポリシー有効時のテスト結果</h2>
    <table>
        <tr><th>URL</th><th>結果</th><th>ステータス</th><th>応答時間</th><th>エラー詳細</th></tr>
"@
        foreach ($result in $EnabledResults) {
            $statusClass = if ($result.Success) { "success" } else { "error" }
            $statusText = if ($result.Success) { "成功" } else { "ブロック/失敗" }
            $html += @"
        <tr>
            <td>$($result.Url)</td>
            <td class="$statusClass">$statusText</td>
            <td>$($result.StatusCode)</td>
            <td>$($result.ResponseTime)ms</td>
            <td>$($result.Error)</td>
        </tr>
"@
        }
        $html += "</table>"
    }

    if ($DisabledResults) {
        $html += @"
    <h2>🔓 ポリシー無効時のテスト結果</h2>
    <table>
        <tr><th>URL</th><th>結果</th><th>ステータス</th><th>応答時間</th><th>エラー詳細</th></tr>
"@
        foreach ($result in $DisabledResults) {
            $statusClass = if ($result.Success) { "success" } else { "error" }
            $statusText = if ($result.Success) { "成功" } else { "失敗" }
            $html += @"
        <tr>
            <td>$($result.Url)</td>
            <td class="$statusClass">$statusText</td>
            <td>$($result.StatusCode)</td>
            <td>$($result.ResponseTime)ms</td>
            <td>$($result.Error)</td>
        </tr>
"@
        }
        $html += "</table>"
    }

    $html += @"
    <div class="summary">
        <h2>📊 テスト結果分析</h2>
        <p>ポリシーが正常に動作している場合、以下の動作が期待されます：</p>
        <ul>
            <li><strong>ポリシー有効時:</strong> ローカルネットワークアドレスへのアクセスがブロックされる</li>
            <li><strong>ポリシー無効時:</strong> ローカルネットワークアドレスへのアクセスが成功する（サーバーが稼働している場合）</li>
        </ul>
    </div>
</body>
</html>
"@

    $html | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "📄 テストレポートを生成しました: $reportPath" -ForegroundColor Green
    return $reportPath
}

# メイン実行部分
Write-Host "🛠️ 事前準備" -ForegroundColor Cyan

# 管理者権限チェック
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  警告: 管理者権限で実行されていません。ポリシー設定が失敗する可能性があります。" -ForegroundColor Yellow
}

# ポリシー状態確認
if (-not $SkipPolicyCheck) {
    Write-Host "現在のポリシー状態を確認しています..."
    & "$PSScriptRoot\verify-policy.ps1"
    Write-Host ""
}

# テストサーバー起動
$serverProcess = $null
if (-not $SkipServerStart) {
    $serverProcess = Start-TestServer -Port $testConfig.ServerPort
}

# テスト実行
$enabledResults = $null
$disabledResults = $null

try {
    if ($TestMode -eq "both" -or $TestMode -eq "enabled") {
        Write-Host ""
        Write-Host "🔒 ポリシー有効時のテスト" -ForegroundColor Cyan
        
        if ($AutoApplyPolicy) {
            Set-LocalNetworkPolicy -Enable $true
            Restart-EdgeBrowser
        } else {
            Write-Host "ポリシーを有効にして、Edgeを再起動してからEnterキーを押してください..."
            Read-Host
        }
        
        $enabledResults = Test-NetworkAccess -TestUrls $testConfig.TestUrls -TestName "ポリシー有効"
    }
    
    if ($TestMode -eq "both" -or $TestMode -eq "disabled") {
        Write-Host ""
        Write-Host "🔓 ポリシー無効時のテスト" -ForegroundColor Cyan
        
        if ($AutoApplyPolicy) {
            Set-LocalNetworkPolicy -Enable $false
            Restart-EdgeBrowser
        } else {
            Write-Host "ポリシーを無効にして、Edgeを再起動してからEnterキーを押してください..."
            Read-Host
        }
        
        $disabledResults = Test-NetworkAccess -TestUrls $testConfig.TestUrls -TestName "ポリシー無効"
    }
    
    # テストレポート生成
    Write-Host ""
    Write-Host "📋 テスト結果レポート生成" -ForegroundColor Cyan
    $reportPath = Generate-TestReport -EnabledResults $enabledResults -DisabledResults $disabledResults -TestConfig $testConfig
    
    # 結果サマリー
    Write-Host ""
    Write-Host "🎯 テスト完了サマリー" -ForegroundColor Green
    
    if ($enabledResults) {
        $enabledBlocked = ($enabledResults | Where-Object { -not $_.Success }).Count
        Write-Host "ポリシー有効時: $enabledBlocked/$($enabledResults.Count) がブロック"
    }
    
    if ($disabledResults) {
        $disabledSuccess = ($disabledResults | Where-Object { $_.Success }).Count
        Write-Host "ポリシー無効時: $disabledSuccess/$($disabledResults.Count) が成功"
    }
    
    Write-Host ""
    Write-Host "💡 次のステップ:" -ForegroundColor Cyan
    Write-Host "1. test-page.html をEdgeで開いて手動テストを実行"
    Write-Host "2. DevToolsでネットワークタブとコンソールを確認"
    Write-Host "3. 生成されたレポート ($reportPath) を確認"
    
} finally {
    # クリーンアップ
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Write-Host ""
        Write-Host "🧹 クリーンアップ中..." -ForegroundColor Yellow
        try {
            $serverProcess.Kill()
            Write-Host "✅ テストサーバーを停止しました。" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  サーバープロセスの停止に失敗しました。手動で終了してください。" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "テスト実行完了。" -ForegroundColor Green
