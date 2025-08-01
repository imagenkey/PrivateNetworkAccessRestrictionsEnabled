// LocalNetworkAccessRestrictionsEnabled ポリシーテスト用JavaScriptライブラリ

// テスト対象アドレスの定義
function getTestTargets() {
    return [
        // ローカルホスト
        { url: 'http://localhost:8080', description: 'ローカルホスト (IPv4)' },
        { url: 'http://127.0.0.1:8080', description: 'ループバック IPv4' },
        { url: 'http://[::1]:8080', description: 'ループバック IPv6' },

        // プライベートIPアドレス範囲 (Class A)
        { url: 'http://10.0.0.1:80', description: 'Class A プライベート IP' },
        { url: 'http://10.1.1.1:8080', description: 'Class A プライベート IP (ルーター)' },

        // プライベートIPアドレス範囲 (Class B)
        { url: 'http://172.16.0.1:80', description: 'Class B プライベート IP' },
        { url: 'http://172.31.255.254:8080', description: 'Class B プライベート IP (上限)' },

        // プライベートIPアドレス範囲 (Class C)
        { url: 'http://192.168.1.1:80', description: 'Class C プライベート IP (ルーター)' },
        { url: 'http://192.168.0.1:80', description: 'Class C プライベート IP (ルーター)' },
        { url: 'http://192.168.1.100:8080', description: 'Class C プライベート IP (デバイス)' },

        // リンクローカルアドレス
        { url: 'http://169.254.1.1:80', description: 'リンクローカルアドレス' },

        // 一般的なルーターアドレス
        { url: 'http://192.168.1.1:80', description: '一般的なルーターアドレス' },
        { url: 'http://192.168.0.1:80', description: '一般的なルーターアドレス' },
        { url: 'http://10.0.0.1:80', description: '企業ネットワークルーター' },

        // 一般的なサービスポート
        { url: 'http://192.168.1.1:8080', description: 'Webサービス (8080)' },
        { url: 'http://192.168.1.1:3000', description: '開発サーバー (3000)' },
        { url: 'http://192.168.1.1:5000', description: 'アプリケーションサーバー (5000)' },
        { url: 'http://192.168.1.1:9090', description: '管理インターフェース (9090)' }
    ];
}

// 単一ターゲットのテスト
async function testSingleTarget() {
    const input = document.getElementById('customTarget');
    const resultDiv = document.getElementById('singleTestResult');
    const target = input.value.trim();

    if (!target) {
        showResult(resultDiv, 'テスト対象のアドレスを入力してください。', 'warning');
        return;
    }

    // URLの正規化
    const url = target.startsWith('http') ? target : `http://${target}`;

    showResult(resultDiv, `テスト開始: ${url}`, 'info');
    resultDiv.style.display = 'block';

    try {
        const result = await testNetworkRequest(url);
        showResult(resultDiv, `テスト完了: ${url}\n${result.message}\n詳細: ${JSON.stringify(result, null, 2)}`,
            result.blocked ? 'error' : 'success');
    } catch (error) {
        showResult(resultDiv, `テストエラー: ${url}\nエラー: ${error.message}`, 'error');
    }
}

// ローカルネットワークスキャン
async function runLocalNetworkScan() {
    const resultDiv = document.getElementById('bulkTestResult');
    resultDiv.style.display = 'block';
    showResult(resultDiv, 'ローカルネットワークスキャンを開始しています...', 'info');

    const targets = getTestTargets();
    const results = [];
    let completedTests = 0;

    for (const target of targets) {
        try {
            const result = await testNetworkRequest(target.url);
            results.push({
                url: target.url,
                description: target.description,
                result: result
            });

            completedTests++;
            showResult(resultDiv,
                `進行状況: ${completedTests}/${targets.length} 完了\n最新テスト: ${target.url} - ${result.blocked ? 'ブロック' : '成功'}`,
                'info');
        } catch (error) {
            results.push({
                url: target.url,
                description: target.description,
                result: { blocked: true, message: error.message, error: true }
            });
            completedTests++;
        }

        // 要求間の遅延（ブラウザ過負荷防止）
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    displayScanResults(resultDiv, results, 'ローカルネットワークスキャン結果');
}

// プライベートIP範囲スキャン
async function runPrivateIPScan() {
    const resultDiv = document.getElementById('bulkTestResult');
    resultDiv.style.display = 'block';
    showResult(resultDiv, 'プライベートIP範囲スキャンを開始しています...', 'info');

    const privateRanges = [
        '192.168.1.1',
        '192.168.0.1',
        '10.0.0.1',
        '172.16.0.1',
        '169.254.1.1'
    ];

    const results = [];

    for (const ip of privateRanges) {
        const url = `http://${ip}:80`;
        try {
            const result = await testNetworkRequest(url);
            results.push({
                url: url,
                description: `プライベートIP: ${ip}`,
                result: result
            });
        } catch (error) {
            results.push({
                url: url,
                description: `プライベートIP: ${ip}`,
                result: { blocked: true, message: error.message, error: true }
            });
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    displayScanResults(resultDiv, results, 'プライベートIP範囲スキャン結果');
}

// 一般的なサービスポートスキャン
async function runCommonServiceScan() {
    const resultDiv = document.getElementById('bulkTestResult');
    resultDiv.style.display = 'block';
    showResult(resultDiv, '一般的なサービスポートスキャンを開始しています...', 'info');

    const commonPorts = [80, 8080, 3000, 5000, 8000, 9090, 8888];
    const testIP = '192.168.1.1';
    const results = [];

    for (const port of commonPorts) {
        const url = `http://${testIP}:${port}`;
        try {
            const result = await testNetworkRequest(url);
            results.push({
                url: url,
                description: `ポート ${port} (${getPortDescription(port)})`,
                result: result
            });
        } catch (error) {
            results.push({
                url: url,
                description: `ポート ${port} (${getPortDescription(port)})`,
                result: { blocked: true, message: error.message, error: true }
            });
        }

        await new Promise(resolve => setTimeout(resolve, 150));
    }

    displayScanResults(resultDiv, results, '一般的なサービスポートスキャン結果');
}

// ネットワーク要求のテスト実行
async function testNetworkRequest(url) {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

        fetch(url, {
            method: 'GET',
            mode: 'no-cors', // CORS制限を回避
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeoutId);
                const endTime = Date.now();

                resolve({
                    blocked: false,
                    message: `要求成功 (${endTime - startTime}ms)`,
                    status: response.status,
                    type: response.type,
                    responseTime: endTime - startTime
                });
            })
            .catch(error => {
                clearTimeout(timeoutId);
                const endTime = Date.now();

                // エラーの種類を判定
                let blocked = false;
                let message = '';

                if (error.name === 'AbortError') {
                    message = 'タイムアウト (5秒)';
                } else if (error.message.includes('Failed to fetch')) {
                    blocked = true;
                    message = `ネットワークエラー - 要求がブロックされた可能性 (${endTime - startTime}ms)`;
                } else if (error.message.includes('CORS')) {
                    message = `CORS制限 (${endTime - startTime}ms)`;
                } else {
                    blocked = true;
                    message = `エラー: ${error.message} (${endTime - startTime}ms)`;
                }

                resolve({
                    blocked: blocked,
                    message: message,
                    error: error.message,
                    responseTime: endTime - startTime
                });
            });
    });
}

// ポリシー状態の詳細テスト（改良版）
async function testPolicyStatus() {
    try {
        console.log('[PolicyTest] ポリシー状態の詳細検証を開始...');

        // 複数のテストポイントで検証
        const testPoints = [
            'http://192.168.1.1:80',
            'http://10.0.0.1:80',
            'http://172.16.0.1:80',
            'http://192.168.0.1:80'
        ];

        const results = [];
        let fastBlockCount = 0;
        let totalBlockCount = 0;
        let consistentTimingPattern = true;

        for (const url of testPoints) {
            const result = await testNetworkRequest(url);
            results.push(result);

            console.log(`[PolicyTest] ${url}: blocked=${result.blocked}, time=${result.responseTime}ms`);

            if (result.blocked) {
                totalBlockCount++;
                // 非常に早い失敗（ポリシーブロックの特徴）
                if (result.responseTime < 50) {
                    fastBlockCount++;
                }
            }

            // タイミングパターンの分析
            if (result.responseTime > 200) {
                consistentTimingPattern = false;
            }
        }

        // 追加の検証：特殊なネットワーク要求パターン
        const specialTestResult = await performSpecialPolicyTest();

        // 判定ロジック（複数要因による総合判定）
        const blockRatio = totalBlockCount / testPoints.length;
        const fastBlockRatio = fastBlockCount / Math.max(totalBlockCount, 1);

        console.log(`[PolicyTest] 統計: 全ブロック率=${blockRatio}, 高速ブロック率=${fastBlockRatio}, 一貫性=${consistentTimingPattern}`);
        console.log(`[PolicyTest] 特殊テスト結果:`, specialTestResult);

        // ポリシー有効の判定条件：
        // 1. 高いブロック率 (80%以上)
        // 2. 高い高速ブロック率 (70%以上)
        // 3. 一貫した早いタイミング
        // 4. 特殊テストでの特徴的な動作
        const policyEnabled = (
            blockRatio >= 0.8 &&
            fastBlockRatio >= 0.7 &&
            consistentTimingPattern &&
            specialTestResult.indicatesPolicyEnabled
        );

        console.log(`[PolicyTest] 最終判定: ポリシー有効=${policyEnabled}`);

        return policyEnabled;

    } catch (error) {
        console.error('[PolicyTest] エラー:', error);
        return false;
    }
}

// 特殊なポリシー検証テスト
async function performSpecialPolicyTest() {
    try {
        const testResults = [];

        // 1. 複数の同時要求テスト（ポリシー有効時は全て即座に失敗）
        const simultaneousUrls = [
            'http://192.168.1.1:80',
            'http://192.168.1.2:80',
            'http://192.168.1.3:80'
        ];

        const startTime = Date.now();
        const simultaneousPromises = simultaneousUrls.map(url =>
            testNetworkRequest(url).catch(e => ({ blocked: true, responseTime: Date.now() - startTime, error: e.message }))
        );

        const simultaneousResults = await Promise.all(simultaneousPromises);
        const maxSimultaneousTime = Math.max(...simultaneousResults.map(r => r.responseTime));

        // 2. 異なるポート番号での連続テスト
        const portTestResults = [];
        for (const port of [80, 8080, 3000]) {
            const result = await testNetworkRequest(`http://192.168.1.1:${port}`);
            portTestResults.push(result);
        }

        // 3. プロトコル違いテスト（HTTP vs HTTPS）
        let httpsTestResult = null;
        try {
            httpsTestResult = await testNetworkRequest('https://192.168.1.1:443');
        } catch (e) {
            httpsTestResult = { blocked: true, responseTime: 0, error: e.message };
        }

        // 結果分析
        const allSimultaneousBlocked = simultaneousResults.every(r => r.blocked);
        const allSimultaneousFast = maxSimultaneousTime < 100;
        const allPortsBlocked = portTestResults.every(r => r.blocked);
        const consistentBehavior = allSimultaneousBlocked && allPortsBlocked;

        console.log(`[SpecialTest] 同時要求: 全ブロック=${allSimultaneousBlocked}, 高速=${allSimultaneousFast}`);
        console.log(`[SpecialTest] ポート別: 全ブロック=${allPortsBlocked}`);
        console.log(`[SpecialTest] 一貫性: ${consistentBehavior}`);

        return {
            indicatesPolicyEnabled: allSimultaneousBlocked && allSimultaneousFast && consistentBehavior,
            simultaneousTest: { allBlocked: allSimultaneousBlocked, maxTime: maxSimultaneousTime },
            portTest: { allBlocked: allPortsBlocked },
            httpsTest: httpsTestResult,
            consistency: consistentBehavior
        };

    } catch (error) {
        console.error('[SpecialTest] エラー:', error);
        return {
            indicatesPolicyEnabled: false,
            error: error.message
        };
    }
}// 結果の表示
function showResult(element, message, type) {
    element.className = `result ${type}`;
    element.textContent = message;
    element.style.display = 'block';
}

// スキャン結果の詳細表示
function displayScanResults(element, results, title) {
    const blocked = results.filter(r => r.result.blocked).length;
    const successful = results.length - blocked;

    let summary = `${title}\n`;
    summary += `\n概要:\n`;
    summary += `• 総テスト数: ${results.length}\n`;
    summary += `• ブロック: ${blocked}\n`;
    summary += `• 成功/その他: ${successful}\n\n`;

    summary += `詳細結果:\n`;
    results.forEach(result => {
        const status = result.result.blocked ? '❌ ブロック' : '✅ 成功';
        summary += `${status} ${result.url}\n`;
        summary += `   ${result.description}\n`;
        summary += `   ${result.result.message}\n\n`;
    });

    const type = blocked > successful ? 'error' : blocked > 0 ? 'warning' : 'success';
    showResult(element, summary, type);
}

// ポート番号の説明
function getPortDescription(port) {
    const descriptions = {
        80: 'HTTP',
        8080: 'HTTP代替',
        3000: '開発サーバー',
        5000: 'アプリケーション',
        8000: 'HTTP代替',
        9090: '管理インターフェース',
        8888: 'HTTP代替'
    };
    return descriptions[port] || '不明';
}

// 結果のクリア
function clearResults() {
    const resultDivs = document.querySelectorAll('.result');
    resultDivs.forEach(div => {
        div.style.display = 'none';
        div.textContent = '';
    });
}

// コンソールログ関数（デバッグ用）
function logToConsole(message, data = null) {
    console.log(`[LocalNetworkAccessTest] ${message}`, data);
}
