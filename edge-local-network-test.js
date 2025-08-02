// ==================================================================
// Microsoft Edge v138+ ローカルネットワークアクセス制御テスト
// シンプル版 - ネイティブダイアログテスト専用
// ==================================================================

console.log('[EdgeLocalNetworkTest] テストモジュール読み込み完了 - v138以降対応');

// ==================================================================
// 基本テスト関数（シンプル版）
// ==================================================================

/**
 * ネットワーク要求テスト（基本版）
 */
async function performNetworkRequest(url, description = '') {
    const startTime = Date.now();

    console.log(`[EdgeTest] テスト開始: ${url} (${description})`);

    return new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト（ダイアログ選択時間を考慮）

        fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeoutId);
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                console.log(`[EdgeTest] 成功: ${url} (${responseTime}ms)`);

                resolve({
                    success: true,
                    responseTime: responseTime,
                    type: response.type,
                    message: `要求成功 (${responseTime}ms)`,
                    dialogSuspected: responseTime > 1000 // 1秒以上はダイアログ操作の可能性
                });
            })
            .catch(error => {
                clearTimeout(timeoutId);
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                console.log(`[EdgeTest] エラー: ${url} (${responseTime}ms) - ${error.message}`);

                let dialogSuspected = false;
                let message = '';

                if (error.name === 'AbortError') {
                    message = 'タイムアウト - ダイアログが表示されている可能性';
                    dialogSuspected = true;
                } else if (error.message.includes('Failed to fetch')) {
                    if (responseTime < 50) {
                        message = `即座のブロック - ポリシーまたは設定によるブロック (${responseTime}ms)`;
                    } else if (responseTime > 500) {
                        message = `遅延ブロック - ユーザーがダイアログで「ブロック」を選択した可能性 (${responseTime}ms)`;
                        dialogSuspected = true;
                    } else {
                        message = `ネットワークエラー (${responseTime}ms)`;
                    }
                } else {
                    message = `エラー: ${error.message} (${responseTime}ms)`;
                }

                resolve({
                    success: false,
                    responseTime: responseTime,
                    error: error.message,
                    message: message,
                    dialogSuspected: dialogSuspected
                });
            });
    });
}

// ==================================================================
// 一般的なテスト対象
// ==================================================================

const commonTestTargets = [
    { url: 'http://192.168.1.1:80', description: 'ルーター (一般的)' },
    { url: 'http://192.168.0.1:80', description: 'ルーター (代替)' },
    { url: 'http://10.0.0.1:80', description: 'プライベートネットワーク' },
    { url: 'http://172.16.0.1:80', description: 'エンタープライズネットワーク' },
    { url: 'http://127.0.0.1:8000', description: 'ローカルホスト開発サーバー' },
    { url: 'http://localhost:3000', description: 'ローカルアプリケーション' }
];

/**
 * テスト対象一覧取得
 */
function getTestTargets() {
    return commonTestTargets;
}

// ==================================================================
// Edge v138以降の機能確認
// ==================================================================

/**
 * Microsoft Edge バージョン確認
 */
function checkEdgeVersionSupport() {
    const userAgent = navigator.userAgent;

    if (!userAgent.includes('Edg/')) {
        return {
            supported: false,
            message: 'Microsoft Edge以外のブラウザです',
            version: null
        };
    }

    const edgeVersion = userAgent.match(/Edg\/(\d+)/);
    if (!edgeVersion) {
        return {
            supported: false,
            message: 'Edgeバージョンを特定できません',
            version: null
        };
    }

    const version = parseInt(edgeVersion[1]);

    return {
        supported: version >= 138,
        message: version >= 138 ?
            `Edge v${version} - ローカルネットワークアクセス制御対応` :
            `Edge v${version} - v138以降が必要`,
        version: version
    };
}

/**
 * フラグ設定ガイダンス
 */
function getFlagGuidance() {
    return {
        url: 'edge://flags/#local-network-access-check',
        settings: {
            'Enabled': 'ダイアログ表示（推奨テスト設定）',
            'Enabled (Blocking)': '完全ブロック（ダイアログなし）',
            'Disabled': '従来動作（警告のみ）'
        },
        recommendation: 'テストには "Enabled" 設定を推奨します'
    };
}

// ==================================================================
// シンプル化されたテスト実行関数
// ==================================================================

/**
 * ルーターアクセステスト
 */
async function quickTestRouter() {
    return await performNetworkRequest('http://192.168.1.1:80', 'ルーターアクセス');
}

/**
 * ローカルホストテスト
 */
async function quickTestLocalhost() {
    return await performNetworkRequest('http://127.0.0.1:8000', 'ローカルホスト');
}

/**
 * プライベートネットワークテスト
 */
async function quickTestPrivateNetwork() {
    return await performNetworkRequest('http://10.0.0.1:80', 'プライベートネットワーク');
}

// ==================================================================
// ログ出力とデバッグ支援
// ==================================================================

/**
 * テスト結果の詳細ログ
 */
function logTestResult(result, testName) {
    console.group(`[EdgeTest] ${testName} 結果`);
    console.log('成功:', result.success);
    console.log('応答時間:', result.responseTime + 'ms');
    console.log('ダイアログ疑い:', result.dialogSuspected);
    console.log('メッセージ:', result.message);
    if (result.error) {
        console.log('エラー:', result.error);
    }
    console.groupEnd();
}

/**
 * ブラウザ環境情報の表示
 */
function logBrowserInfo() {
    const versionInfo = checkEdgeVersionSupport();
    const flagInfo = getFlagGuidance();

    console.group('[EdgeTest] ブラウザ環境情報');
    console.log('対応状況:', versionInfo.supported ? '✅ 対応' : '❌ 非対応');
    console.log('メッセージ:', versionInfo.message);
    console.log('推奨フラグ設定:', flagInfo.url);
    console.log('設定ガイド:', flagInfo.settings);
    console.groupEnd();
}

// ==================================================================
// 初期化
// ==================================================================

// ページ読み込み時にブラウザ情報をログ出力
document.addEventListener('DOMContentLoaded', function () {
    logBrowserInfo();
    console.log('[EdgeTest] Microsoft Edge v138+ ローカルネットワークアクセス制御テスト準備完了');
});
