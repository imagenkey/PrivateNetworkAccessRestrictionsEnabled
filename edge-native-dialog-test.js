// ==================================================================
// Microsoft Edge ネイティブ許可ダイアログテスト
// LocalNetworkAccessRestrictionsEnabled Policy
// ==================================================================

console.log('[EdgeNativeDialog] Microsoft Edge ネイティブダイアログテストモジュール読み込み完了');

// ==================================================================
// ネイティブダイアログトリガー機能
// ==================================================================

/**
 * ルーターアクセスでMicrosoft Edgeのネイティブダイアログをトリガー
 */
async function triggerEdgeNativeDialog_Router() {
    console.log('[EdgeNativeDialog] ルーターアクセスダイアログトリガーを開始...');
    const resultDiv = document.getElementById('dialogTriggerResult');
    
    showResult(resultDiv, 'ルーターアクセステスト実行中...\n\n📢 Microsoft Edgeがダイアログを表示する場合があります。\n表示されたら許可/ブロックを選択してください。', 'info');
    
    try {
        const startTime = Date.now();
        
        // 一般的なルーターIPアドレスにアクセス
        // これによりMicrosoft Edgeのネイティブダイアログがトリガーされる可能性があります
        const response = await fetch('http://192.168.1.1:80', {
            method: 'GET',
            mode: 'no-cors', // CORS制限を回避
            cache: 'no-cache'
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let message = `ルーターアクセステスト結果:\n\n`;
        message += `対象URL: http://192.168.1.1:80\n`;
        message += `応答時間: ${responseTime}ms\n`;
        message += `応答タイプ: ${response.type}\n`;
        message += `ステータス: ${response.status || 'N/A'}\n\n`;
        
        if (response.type === 'opaque' && responseTime < 100) {
            message += '⚠️ 可能性: ポリシーによる即座のブロック\n';
            message += 'Microsoft Edgeダイアログが表示されましたか？';
        } else if (response.type === 'opaque' && responseTime > 100) {
            message += '✅ 可能性: アクセス成功（ユーザーが許可した、またはポリシー無効）\n';
            message += 'Microsoft Edgeダイアログで許可を選択しましたか？';
        } else {
            message += '📝 予期しない応答パターンです。';
        }
        
        showResult(resultDiv, message, responseTime < 100 ? 'error' : 'success');
        
    } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let message = `ルーターアクセステスト結果:\n\n`;
        message += `対象URL: http://192.168.1.1:80\n`;
        message += `エラー: ${error.message}\n`;
        message += `応答時間: ${responseTime}ms\n\n`;
        
        if (error.message.includes('Failed to fetch') && responseTime < 50) {
            message += '✅ 確認: ポリシーによる即座のブロック\n';
            message += 'Microsoft Edgeがダイアログを表示してブロックを選択したか、\n';
            message += 'またはポリシーによる自動ブロックが実行されました。';
            showResult(resultDiv, message, 'warning');
        } else {
            message += '❌ ネットワークエラーまたはその他の問題が発生しました。';
            showResult(resultDiv, message, 'error');
        }
    }
}

/**
 * ローカルサーバーアクセスでMicrosoft Edgeのネイティブダイアログをトリガー
 */
async function triggerEdgeNativeDialog_LocalServer() {
    console.log('[EdgeNativeDialog] ローカルサーバーアクセスダイアログトリガーを開始...');
    const resultDiv = document.getElementById('dialogTriggerResult');
    
    showResult(resultDiv, 'ローカルサーバーアクセステスト実行中...\n\n📢 Microsoft Edgeがダイアログを表示する場合があります。', 'info');
    
    try {
        const startTime = Date.now();
        
        // ローカルホストサーバーにアクセス
        const response = await fetch('http://localhost:8000', {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache'
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let message = `ローカルサーバーアクセステスト結果:\n\n`;
        message += `対象URL: http://localhost:8000\n`;
        message += `応答時間: ${responseTime}ms\n`;
        message += `応答タイプ: ${response.type}\n\n`;
        
        if (responseTime < 100) {
            message += '⚠️ 高速応答: ポリシーブロックまたは即座の接続\n';
            message += 'Microsoft Edgeダイアログが表示されましたか？';
        } else {
            message += '✅ 通常応答: サーバー接続成功\n';
            message += 'ローカルサーバーが実際に起動している可能性があります。';
        }
        
        showResult(resultDiv, message, 'success');
        
    } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let message = `ローカルサーバーアクセステスト結果:\n\n`;
        message += `対象URL: http://localhost:8000\n`;
        message += `エラー: ${error.message}\n`;
        message += `応答時間: ${responseTime}ms\n\n`;
        
        if (responseTime < 50) {
            message += '✅ ポリシーによる即座のブロック確認\n';
            message += 'Microsoft Edgeのネイティブダイアログが機能している可能性があります。';
            showResult(resultDiv, message, 'warning');
        } else {
            message += '📝 サーバー未起動またはネットワークエラー';
            showResult(resultDiv, message, 'info');
        }
    }
}

/**
 * プライベートIPアクセスでMicrosoft Edgeのネイティブダイアログをトリガー
 */
async function triggerEdgeNativeDialog_PrivateRange() {
    console.log('[EdgeNativeDialog] プライベートIPアクセスダイアログトリガーを開始...');
    const resultDiv = document.getElementById('dialogTriggerResult');
    
    showResult(resultDiv, 'プライベートIPアクセステスト実行中...\n\n📢 複数のプライベートIPでダイアログテストを実行します。', 'info');
    
    const privateIPs = [
        '10.0.0.1',
        '172.16.0.1',
        '192.168.0.1'
    ];
    
    const results = [];
    
    for (const ip of privateIPs) {
        try {
            const startTime = Date.now();
            
            const response = await fetch(`http://${ip}:80`, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                ip: ip,
                success: true,
                responseTime: responseTime,
                type: response.type,
                message: `応答成功 (${responseTime}ms)`
            });
            
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                ip: ip,
                success: false,
                responseTime: responseTime,
                error: error.message,
                message: `エラー: ${error.message} (${responseTime}ms)`
            });
        }
        
        // 各要求間に適切な間隔を設ける
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 結果のサマリー
    let message = `プライベートIPアクセステスト結果:\n\n`;
    message += `テスト対象: ${privateIPs.length} IP\n`;
    message += `成功: ${results.filter(r => r.success).length}\n`;
    message += `ブロック/エラー: ${results.filter(r => !r.success).length}\n\n`;
    
    message += `詳細結果:\n`;
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        message += `${status} ${result.ip} - ${result.message}\n`;
    });
    
    message += `\n📊 分析:\n`;
    const fastBlocks = results.filter(r => !r.success && r.responseTime < 50).length;
    if (fastBlocks > 0) {
        message += `• ${fastBlocks}個の高速ブロック（ポリシー有効の可能性）\n`;
        message += `• Microsoft Edgeダイアログが表示されましたか？`;
    } else {
        message += `• 高速ブロックなし（ポリシー無効またはサーバー応答）`;
    }
    
    const resultType = fastBlocks > 0 ? 'warning' : 'info';
    showResult(resultDiv, message, resultType);
}

// ==================================================================
// 詳細分析機能
// ==================================================================

/**
 * ダイアログ動作パターン分析
 */
async function analyzeDialogBehavior() {
    console.log('[EdgeNativeDialog] ダイアログ動作パターン分析を開始...');
    const resultDiv = document.getElementById('analysisResult');
    
    showResult(resultDiv, 'ダイアログ動作パターンを分析中...\n\n複数のパターンでネイティブダイアログの動作を確認します。', 'info');
    
    const testPatterns = [
        { url: 'http://192.168.1.1:80', description: 'ルーター (標準)' },
        { url: 'http://192.168.1.1:8080', description: 'ルーター (代替ポート)' },
        { url: 'http://10.0.0.1:80', description: 'プライベートネットワーク' },
        { url: 'http://127.0.0.1:8000', description: 'ローカルホスト' }
    ];
    
    const analysisResults = [];
    
    for (const pattern of testPatterns) {
        try {
            console.log(`[EdgeNativeDialog] テスト中: ${pattern.url}`);
            
            const startTime = Date.now();
            
            const response = await fetch(pattern.url, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            analysisResults.push({
                url: pattern.url,
                description: pattern.description,
                success: true,
                responseTime: responseTime,
                type: response.type,
                dialogTriggered: responseTime > 1000 || response.type === 'opaque'
            });
            
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            analysisResults.push({
                url: pattern.url,
                description: pattern.description,
                success: false,
                responseTime: responseTime,
                error: error.message,
                dialogTriggered: responseTime > 100 // ユーザー操作による遅延の可能性
            });
        }
        
        // 各テスト間の適切な間隔
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 分析レポート生成
    let message = `ダイアログ動作パターン分析結果:\n\n`;
    
    const potentialDialogs = analysisResults.filter(r => r.dialogTriggered).length;
    const fastBlocks = analysisResults.filter(r => !r.success && r.responseTime < 50).length;
    const slowResponses = analysisResults.filter(r => r.responseTime > 1000).length;
    
    message += `📊 統計サマリー:\n`;
    message += `• 総テスト数: ${analysisResults.length}\n`;
    message += `• ダイアログ疑い: ${potentialDialogs}\n`;
    message += `• 高速ブロック: ${fastBlocks}\n`;
    message += `• 遅延応答: ${slowResponses}\n\n`;
    
    message += `🔍 詳細分析:\n`;
    analysisResults.forEach(result => {
        const status = result.success ? '✅ 成功' : '❌ ブロック';
        const dialogIndicator = result.dialogTriggered ? '🔔 ダイアログ疑い' : '⚡ 即座';
        message += `${status} ${dialogIndicator} ${result.url}\n`;
        message += `   ${result.description} (${result.responseTime}ms)\n`;
        if (result.error) {
            message += `   エラー: ${result.error}\n`;
        }
        message += `\n`;
    });
    
    message += `💡 解釈:\n`;
    if (potentialDialogs > 0) {
        message += `• ${potentialDialogs}個のテストでダイアログ表示の可能性\n`;
        message += `• Microsoft Edgeのネイティブ許可システムが動作している可能性があります\n`;
        message += `• 実際にダイアログが表示されましたか？`;
    } else if (fastBlocks > 0) {
        message += `• ${fastBlocks}個の高速ブロック検出\n`;
        message += `• ポリシーによる自動ブロックが機能している可能性があります`;
    } else {
        message += `• ダイアログ動作の明確な証拠が見つかりませんでした\n`;
        message += `• ポリシーが無効であるか、テスト条件が不適切な可能性があります`;
    }
    
    const resultType = potentialDialogs > 0 ? 'success' : fastBlocks > 0 ? 'warning' : 'info';
    showResult(resultDiv, message, resultType);
}

/**
 * 許可の永続性テスト
 */
async function testPersistentPermissions() {
    console.log('[EdgeNativeDialog] 許可の永続性テストを開始...');
    const resultDiv = document.getElementById('analysisResult');
    
    showResult(resultDiv, '許可の永続性をテスト中...\n\n同じURLに複数回アクセスして許可状態の永続性を確認します。', 'info');
    
    const testUrl = 'http://192.168.1.1:80';
    const attempts = 3;
    const results = [];
    
    for (let i = 0; i < attempts; i++) {
        try {
            console.log(`[EdgeNativeDialog] 永続性テスト ${i + 1}/${attempts}`);
            
            const startTime = Date.now();
            
            const response = await fetch(testUrl, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                // キャッシュを完全に回避
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                attempt: i + 1,
                success: true,
                responseTime: responseTime,
                type: response.type
            });
            
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                attempt: i + 1,
                success: false,
                responseTime: responseTime,
                error: error.message
            });
        }
        
        // 試行間の間隔
        if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // 永続性分析
    let message = `許可の永続性テスト結果:\n\n`;
    message += `テストURL: ${testUrl}\n`;
    message += `試行回数: ${attempts}\n\n`;
    
    message += `詳細結果:\n`;
    results.forEach(result => {
        const status = result.success ? '✅ 成功' : '❌ ブロック';
        message += `試行${result.attempt}: ${status} (${result.responseTime}ms)\n`;
        if (result.error) {
            message += `   エラー: ${result.error}\n`;
        }
    });
    
    // パターン分析
    const successCount = results.filter(r => r.success).length;
    const blockCount = results.filter(r => !r.success).length;
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    message += `\n📊 パターン分析:\n`;
    message += `• 成功: ${successCount}/${attempts}\n`;
    message += `• ブロック: ${blockCount}/${attempts}\n`;
    message += `• 平均応答時間: ${Math.round(avgResponseTime)}ms\n\n`;
    
    message += `💡 永続性評価:\n`;
    if (successCount === attempts) {
        message += `✅ 一貫して成功 - 許可が永続化されている可能性\n`;
        message += `または、ポリシーが無効な状態`;
    } else if (blockCount === attempts) {
        message += `❌ 一貫してブロック - 拒否が永続化されている可能性\n`;
        message += `または、ポリシーによる継続的なブロック`;
    } else {
        message += `⚠️ 混合結果 - 不安定な状態または条件依存\n`;
        message += `初回でダイアログが表示され、その後の応答が変化した可能性`;
    }
    
    const resultType = successCount === attempts ? 'success' : blockCount === attempts ? 'error' : 'warning';
    showResult(resultDiv, message, resultType);
}

/**
 * 複数ターゲットでのダイアログ動作テスト
 */
async function testMultipleTargetDialog() {
    console.log('[EdgeNativeDialog] 複数ターゲットダイアログ動作テストを開始...');
    const resultDiv = document.getElementById('analysisResult');
    
    showResult(resultDiv, '複数ターゲットでのダイアログ動作をテスト中...\n\n異なるIPアドレスでそれぞれダイアログが表示されるかテストします。', 'info');
    
    const targets = [
        { ip: '192.168.1.1', port: 80, description: 'メインルーター' },
        { ip: '192.168.0.1', port: 80, description: '代替ルーター' },
        { ip: '10.0.0.1', port: 80, description: 'プライベートネットワーク' },
        { ip: '172.16.0.1', port: 80, description: 'エンタープライズネットワーク' }
    ];
    
    const results = [];
    
    for (const target of targets) {
        try {
            const url = `http://${target.ip}:${target.port}`;
            console.log(`[EdgeNativeDialog] テスト中: ${url}`);
            
            const startTime = Date.now();
            
            // 明示的にユーザーがダイアログで選択する時間を考慮
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                ip: target.ip,
                port: target.port,
                description: target.description,
                success: true,
                responseTime: responseTime,
                type: response.type,
                dialogSuspected: responseTime > 1000 // 1秒以上はユーザー操作の可能性
            });
            
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                ip: target.ip,
                port: target.port,
                description: target.description,
                success: false,
                responseTime: responseTime,
                error: error.message,
                dialogSuspected: error.name === 'AbortError' || responseTime > 500
            });
        }
        
        // 各ターゲット間に十分な間隔を置く
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 結果分析
    let message = `複数ターゲットダイアログ動作テスト結果:\n\n`;
    
    const dialogSuspectedCount = results.filter(r => r.dialogSuspected).length;
    const successCount = results.filter(r => r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    message += `📊 概要:\n`;
    message += `• テスト対象: ${targets.length} IP\n`;
    message += `• ダイアログ疑い: ${dialogSuspectedCount}\n`;
    message += `• 成功応答: ${successCount}\n`;
    message += `• 平均応答時間: ${Math.round(avgResponseTime)}ms\n\n`;
    
    message += `🔍 詳細結果:\n`;
    results.forEach(result => {
        const status = result.success ? '✅ 成功' : '❌ ブロック';
        const dialogIndicator = result.dialogSuspected ? '🔔 ダイアログ疑い' : '⚡ 即座';
        message += `${status} ${dialogIndicator} ${result.ip}\n`;
        message += `   ${result.description} (${result.responseTime}ms)\n`;
        if (result.error) {
            message += `   エラー: ${result.error}\n`;
        }
        message += `\n`;
    });
    
    message += `💡 分析:\n`;
    if (dialogSuspectedCount > 0) {
        message += `• ${dialogSuspectedCount}個のターゲットでダイアログ表示の可能性\n`;
        message += `• Microsoft Edgeが各IPアドレスで個別に許可を求めている可能性\n`;
        message += `• 実際に複数のダイアログが表示されましたか？`;
    } else {
        message += `• ダイアログ動作の明確な証拠が見つかりませんでした\n`;
        message += `• 一括許可/拒否または ポリシー無効の可能性`;
    }
    
    const resultType = dialogSuspectedCount > 0 ? 'success' : 'info';
    showResult(resultDiv, message, resultType);
}

/**
 * ブラウザ許可状態リセット
 */
function resetBrowserPermissions() {
    console.log('[EdgeNativeDialog] ブラウザ許可状態リセットガイド表示...');
    const resultDiv = document.getElementById('analysisResult');
    
    let message = `🔄 Microsoft Edge許可状態リセット手順:\n\n`;
    
    message += `📋 手動リセット方法:\n\n`;
    message += `1. Microsoft Edge設定を開く:\n`;
    message += `   • edge://settings/content/all にアクセス\n`;
    message += `   • または 設定 > Cookie とサイトのアクセス許可 > すべてのサイト\n\n`;
    
    message += `2. 現在のサイトを検索:\n`;
    message += `   • "${window.location.hostname}" で検索\n`;
    message += `   • サイトの許可設定を表示\n\n`;
    
    message += `3. ローカルネットワークアクセス許可をリセット:\n`;
    message += `   • "プライベートネットワークアクセス" 設定を確認\n`;
    message += `   • "リセット" または "削除" をクリック\n\n`;
    
    message += `4. ブラウザ再読み込み:\n`;
    message += `   • F5 または Ctrl+R でページをリロード\n`;
    message += `   • 次回アクセス時に再度ダイアログが表示される可能性\n\n`;
    
    message += `🔧 代替方法:\n`;
    message += `• ブラウザ履歴/データの削除\n`;
    message += `• プライベートブラウジングモードの使用\n`;
    message += `• 別のプロファイルでのテスト\n\n`;
    
    message += `⚠️ 注意:\n`;
    message += `許可状態のリセット後、最初のローカルネットワークアクセス時に\n`;
    message += `Microsoft Edgeのネイティブダイアログが再表示される可能性があります。\n\n`;
    
    message += `この手順完了後、上記のテストボタンを再実行してください。`;
    
    showResult(resultDiv, message, 'info');
}

// ==================================================================
// ユーティリティ関数
// ==================================================================

/**
 * 結果表示ヘルパー
 */
function showResult(element, message, type) {
    element.className = `result ${type}`;
    element.textContent = message;
    element.style.display = 'block';
    
    // 自動スクロール
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================================================================
// イベントリスナー
// ==================================================================

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('[EdgeNativeDialog] Microsoft Edge ネイティブダイアログテストモジュール初期化完了');
    
    // ブラウザ検出
    const isEdge = navigator.userAgent.includes('Edg/');
    if (!isEdge) {
        console.warn('[EdgeNativeDialog] Microsoft Edge以外のブラウザが検出されました');
        
        // 警告表示
        const warningDiv = document.createElement('div');
        warningDiv.className = 'result warning';
        warningDiv.style.display = 'block';
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '100px';
        warningDiv.style.right = '20px';
        warningDiv.style.zIndex = '1001';
        warningDiv.style.maxWidth = '300px';
        warningDiv.textContent = '⚠️ 警告: Microsoft Edge以外のブラウザです。\nLocalNetworkAccessRestrictionsEnabledポリシーは\nMicrosoft Edge専用の機能です。';
        
        document.body.appendChild(warningDiv);
        
        // 5秒後に自動で非表示
        setTimeout(() => {
            warningDiv.style.display = 'none';
        }, 5000);
    }
});
