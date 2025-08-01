// ==================================================================
// ユーザー明示許可テスト - LocalNetworkAccessRestrictionsEnabled
// ==================================================================

// グローバル状態管理
let userPermissionState = {
    granted: false,
    timestamp: null,
    grantedUrls: [],
    deniedUrls: [],
    sessionActive: false
};

// テスト対象URL一覧
const testTargets = [
    { url: 'http://192.168.1.1:80', description: 'ルーター (一般的)' },
    { url: 'http://192.168.0.1:80', description: 'ルーター (代替)' },
    { url: 'http://10.0.0.1:80', description: 'プライベートネットワーク' },
    { url: 'http://172.16.0.1:80', description: 'エンタープライズネットワーク' },
    { url: 'http://localhost:8000', description: 'ローカルホスト開発サーバー' },
    { url: 'http://127.0.0.1:3000', description: 'ローカルアプリケーション' }
];

// ==================================================================
// メイン許可要求機能
// ==================================================================

/**
 * ローカルネットワークアクセス許可を要求
 * ユーザージェスチャが必要な操作
 */
async function requestNetworkPermission() {
    try {
        console.log('[UserPermission] ローカルネットワークアクセス許可要求を開始...');

        // ステップ1: 完了マーク
        markStepCompleted('step1');

        // ブラウザのネイティブ許可システムを試行
        let nativePermissionResult = null;

        try {
            // Navigator Permissions APIを試行
            if ('permissions' in navigator) {
                console.log('[UserPermission] Permissions APIでネイティブ許可要求...');

                // 注意: 現在のブラウザではローカルネットワークアクセス用の
                // 標準Permissions APIは限定的なため、カスタム実装を併用
                const cameraPermission = await navigator.permissions.query({ name: 'camera' });
                console.log('[UserPermission] 参考: カメラ許可状態 =', cameraPermission.state);
            }
        } catch (error) {
            console.log('[UserPermission] ネイティブ許可API利用不可:', error.message);
        }

        // ステップ2: カスタム許可ダイアログ表示
        markStepCompleted('step2');
        await showCustomPermissionDialog();

    } catch (error) {
        console.error('[UserPermission] 許可要求エラー:', error);
        showResult(`許可要求エラー: ${error.message}`, 'error');
        updatePermissionStatus('エラー', 'unknown');
    }
}

/**
 * カスタム許可ダイアログの表示
 */
function showCustomPermissionDialog() {
    return new Promise((resolve) => {
        const modal = document.getElementById('permissionModal');
        const urlsDiv = document.getElementById('requestedUrls');

        // 要求対象URL一覧を表示
        urlsDiv.innerHTML = testTargets.map(target =>
            `• ${target.url} (${target.description})`
        ).join('\n');

        modal.style.display = 'flex';

        // グローバルレゾルバーを設定（ユーザー選択待ち）
        window.permissionResolver = resolve;
    });
}

/**
 * ユーザーの許可/拒否選択を処理
 */
function handleUserPermission(granted) {
    const modal = document.getElementById('permissionModal');
    modal.style.display = 'none';

    // ステップ3: 完了マーク
    markStepCompleted('step3');

    console.log(`[UserPermission] ユーザー選択: ${granted ? '許可' : '拒否'}`);

    // 許可状態を更新
    userPermissionState = {
        granted: granted,
        timestamp: new Date().toISOString(),
        grantedUrls: granted ? testTargets.map(t => t.url) : [],
        deniedUrls: granted ? [] : testTargets.map(t => t.url),
        sessionActive: true
    };

    // 永続化（セッションストレージ）
    localStorage.setItem('localNetworkPermission', JSON.stringify(userPermissionState));

    // UI更新
    updatePermissionStatus(
        granted ? '許可済み' : '拒否済み',
        granted ? 'granted' : 'denied'
    );

    if (granted) {
        document.getElementById('testWithPermissionBtn').disabled = false;
        showResult('✅ ローカルネットワークアクセスが許可されました。\n\n許可されたURL:\n' +
            userPermissionState.grantedUrls.join('\n'), 'success');
    } else {
        showResult('❌ ローカルネットワークアクセスが拒否されました。\n\nセキュリティ保護により、プライベートネットワークへのアクセスはブロックされます。', 'error');
    }

    // ステップ4: 完了マーク
    markStepCompleted('step4');

    // プロミスレゾルバーを呼び出し
    if (window.permissionResolver) {
        window.permissionResolver(granted);
        delete window.permissionResolver;
    }
}

// ==================================================================
// 段階的テスト機能
// ==================================================================

/**
 * レベル1: 許可なしアクセステスト（ブロック確認）
 */
async function testLevel1_NoPermission() {
    console.log('[Level1] 許可なしアクセステストを開始...');
    showResult('レベル1テスト: 許可なしでのアクセス試行中...', 'info');

    // 許可状態を一時的に無効化
    const originalPermission = userPermissionState.granted;
    userPermissionState.granted = false;

    try {
        const testUrl = testTargets[0].url; // 最初のターゲットでテスト
        const result = await performNetworkRequest(testUrl, false);

        let message = `レベル1テスト結果:\n\n`;
        message += `テスト対象: ${testUrl}\n`;
        message += `期待動作: アクセスブロック\n`;
        message += `実際の結果: ${result.blocked ? 'ブロック' : '成功'}\n`;
        message += `応答時間: ${result.responseTime}ms\n`;
        message += `詳細: ${result.message}\n\n`;

        if (result.blocked) {
            message += '✅ 正常: 許可なしアクセスが適切にブロックされました。';
            showResult(message, 'success');
        } else {
            message += '⚠️ 注意: ブロックされませんでした。ポリシーが無効な可能性があります。';
            showResult(message, 'warning');
        }

    } catch (error) {
        showResult(`レベル1テストエラー: ${error.message}`, 'error');
    } finally {
        // 許可状態を復元
        userPermissionState.granted = originalPermission;
    }
}

/**
 * レベル2: 許可要求付きアクセステスト
 */
async function testLevel2_RequestPermission() {
    console.log('[Level2] 許可要求付きアクセステストを開始...');
    showResult('レベル2テスト: 許可要求プロセスをテスト中...', 'info');

    try {
        // 許可が未設定の場合は要求
        if (!userPermissionState.granted) {
            showResult('レベル2テスト: 許可が必要です。許可要求を開始...', 'warning');
            await requestNetworkPermission();
        }

        if (userPermissionState.granted) {
            const testUrl = testTargets[1].url; // 2番目のターゲットでテスト
            const result = await performNetworkRequest(testUrl, true);

            let message = `レベル2テスト結果:\n\n`;
            message += `テスト対象: ${testUrl}\n`;
            message += `許可状態: ${userPermissionState.granted ? '許可済み' : '拒否済み'}\n`;
            message += `期待動作: 許可後のアクセス成功\n`;
            message += `実際の結果: ${result.blocked ? 'ブロック' : '成功'}\n`;
            message += `応答時間: ${result.responseTime}ms\n`;
            message += `詳細: ${result.message}\n\n`;

            if (!result.blocked) {
                message += '✅ 正常: 許可後のアクセスが成功しました。';
                showResult(message, 'success');
            } else {
                message += '⚠️ 異常: 許可済みにも関わらずブロックされました。';
                showResult(message, 'error');
            }
        } else {
            showResult('レベル2テスト: ユーザーがアクセスを拒否したため、テストをスキップしました。', 'warning');
        }

    } catch (error) {
        showResult(`レベル2テストエラー: ${error.message}`, 'error');
    }
}

/**
 * レベル3: 許可済み状態でのアクセステスト
 */
async function testLevel3_PermissionGranted() {
    console.log('[Level3] 許可済み状態アクセステストを開始...');

    if (!userPermissionState.granted) {
        showResult('レベル3テスト: 許可が必要です。先にレベル2テストを実行してください。', 'warning');
        return;
    }

    showResult('レベル3テスト: 許可済み状態での複数アクセスをテスト中...', 'info');

    try {
        const results = [];

        // 複数のターゲットで順次テスト
        for (let i = 0; i < Math.min(3, testTargets.length); i++) {
            const target = testTargets[i];
            const result = await performNetworkRequest(target.url, true);
            results.push({
                url: target.url,
                description: target.description,
                result: result
            });

            // 要求間の適切な間隔
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 結果サマリー
        const successCount = results.filter(r => !r.result.blocked).length;
        const blockCount = results.length - successCount;

        let message = `レベル3テスト結果:\n\n`;
        message += `総テスト数: ${results.length}\n`;
        message += `成功: ${successCount}, ブロック: ${blockCount}\n\n`;
        message += `詳細結果:\n`;

        results.forEach(result => {
            const status = result.result.blocked ? '❌' : '✅';
            message += `${status} ${result.url}\n`;
            message += `   ${result.description}\n`;
            message += `   ${result.result.message}\n\n`;
        });

        if (successCount > blockCount) {
            message += '✅ 正常: 許可済み状態で適切にアクセスできました。';
            showResult(message, 'success');
        } else {
            message += '⚠️ 問題: 許可済みにも関わらず多くのアクセスがブロックされました。';
            showResult(message, 'warning');
        }

    } catch (error) {
        showResult(`レベル3テストエラー: ${error.message}`, 'error');
    }
}

/**
 * レベル4: 複数ターゲットでの許可管理テスト
 */
async function testLevel4_MultipleTargets() {
    console.log('[Level4] 複数ターゲット許可管理テストを開始...');
    showResult('レベル4テスト: 高度な許可管理機能をテスト中...', 'info');

    try {
        const results = [];

        // 全ターゲットでテスト
        for (const target of testTargets) {
            const result = await performNetworkRequest(target.url, userPermissionState.granted);
            results.push({
                url: target.url,
                description: target.description,
                result: result
            });

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 詳細分析
        const analysis = analyzePermissionResults(results);

        let message = `レベル4テスト結果 - 詳細分析:\n\n`;
        message += `許可状態: ${userPermissionState.granted ? '許可済み' : '拒否済み'}\n`;
        message += `総テスト数: ${results.length}\n`;
        message += `成功: ${analysis.successCount}\n`;
        message += `ブロック: ${analysis.blockCount}\n`;
        message += `エラー: ${analysis.errorCount}\n\n`;

        message += `パフォーマンス分析:\n`;
        message += `平均応答時間: ${analysis.avgResponseTime}ms\n`;
        message += `最速アクセス: ${analysis.fastestTime}ms\n`;
        message += `最遅アクセス: ${analysis.slowestTime}ms\n\n`;

        message += `セキュリティ分析:\n`;
        if (analysis.blockCount > 0 && !userPermissionState.granted) {
            message += '✅ 適切にブロックされています\n';
        } else if (analysis.successCount > 0 && userPermissionState.granted) {
            message += '✅ 許可に従ってアクセスできています\n';
        } else {
            message += '⚠️ 予期しない動作パターンです\n';
        }

        message += `\n詳細結果:\n`;
        results.forEach(result => {
            const status = result.result.blocked ? '❌' : '✅';
            message += `${status} ${result.url} (${result.result.responseTime}ms)\n`;
        });

        const resultType = analysis.blockCount === 0 && userPermissionState.granted ? 'success' :
            analysis.blockCount === results.length && !userPermissionState.granted ? 'success' : 'warning';

        showResult(message, resultType);

    } catch (error) {
        showResult(`レベル4テストエラー: ${error.message}`, 'error');
    }
}

// ==================================================================
// Permissions API詳細テスト
// ==================================================================

/**
 * Permissions API対応確認
 */
async function checkPermissionsAPISupport() {
    console.log('[PermissionsAPI] 対応状況を確認中...');

    let message = 'Permissions API対応状況:\n\n';

    try {
        // 基本的なAPI存在確認
        message += `navigator.permissions: ${('permissions' in navigator) ? '✅ 対応' : '❌ 非対応'}\n`;

        if ('permissions' in navigator) {
            // 利用可能な権限タイプの確認
            const testPermissions = ['camera', 'microphone', 'geolocation', 'notifications'];

            for (const permission of testPermissions) {
                try {
                    const result = await navigator.permissions.query({ name: permission });
                    message += `${permission}: ${result.state} (✅ 対応)\n`;
                } catch (error) {
                    message += `${permission}: エラー (❌ 非対応)\n`;
                }
            }

            // カスタム権限テスト
            message += '\nカスタム権限テスト:\n';
            try {
                // 仮想的なローカルネットワーク権限
                const customResult = await navigator.permissions.query({ name: 'local-network' });
                message += `local-network: ${customResult.state} (✅ 対応)\n`;
            } catch (error) {
                message += `local-network: ${error.message} (❌ 非対応)\n`;
            }
        }

        message += '\n📝 注意: ローカルネットワークアクセス用の標準Permissions APIは\n';
        message += 'まだ一般的に利用できません。カスタム実装が必要です。';

        showResult(message, 'info');

    } catch (error) {
        showResult(`Permissions API確認エラー: ${error.message}`, 'error');
    }
}

/**
 * 現在の許可状態クエリ
 */
async function queryCurrentPermissions() {
    console.log('[PermissionsAPI] 現在の許可状態をクエリ中...');

    let message = '現在の許可状態:\n\n';

    try {
        // ローカルストレージからの状態
        const storedPermission = localStorage.getItem('localNetworkPermission');
        if (storedPermission) {
            const permission = JSON.parse(storedPermission);
            message += `カスタム許可状態:\n`;
            message += `許可: ${permission.granted ? '✅ はい' : '❌ いいえ'}\n`;
            message += `タイムスタンプ: ${permission.timestamp}\n`;
            message += `セッション有効: ${permission.sessionActive ? '✅ はい' : '❌ いいえ'}\n`;
            message += `許可済みURL数: ${permission.grantedUrls?.length || 0}\n`;
            message += `拒否済みURL数: ${permission.deniedUrls?.length || 0}\n\n`;
        }

        // ブラウザネイティブ状態
        if ('permissions' in navigator) {
            message += 'ブラウザネイティブ許可状態:\n';
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            message += `カメラ (参考): ${cameraPermission.state}\n`;

            const notificationPermission = await navigator.permissions.query({ name: 'notifications' });
            message += `通知 (参考): ${notificationPermission.state}\n`;
        }

        // セッション情報
        message += '\nセッション情報:\n';
        message += `ユーザーエージェント: ${navigator.userAgent.includes('Edg/') ? 'Microsoft Edge' : 'その他'}\n`;
        message += `セキュアコンテキスト: ${window.isSecureContext ? '✅ はい' : '❌ いいえ'}\n`;
        message += `ローカルストレージ: ${typeof (Storage) !== "undefined" ? '✅ 利用可能' : '❌ 利用不可'}\n`;

        showResult(message, 'info');

    } catch (error) {
        showResult(`許可状態クエリエラー: ${error.message}`, 'error');
    }
}

/**
 * 許可の永続性テスト
 */
async function testPermissionPersistence() {
    console.log('[PermissionsAPI] 許可の永続性をテスト中...');

    let message = '許可永続性テスト:\n\n';

    try {
        // 現在の状態を保存
        const currentState = { ...userPermissionState };

        // テストデータで上書き
        const testPermission = {
            granted: true,
            timestamp: new Date().toISOString(),
            grantedUrls: ['http://test.local:8080'],
            deniedUrls: [],
            sessionActive: true
        };

        localStorage.setItem('localNetworkPermission_test', JSON.stringify(testPermission));

        // 読み取りテスト
        const retrieved = JSON.parse(localStorage.getItem('localNetworkPermission_test'));

        message += '永続化テスト:\n';
        message += `書き込み: ${testPermission.granted ? '✅' : '❌'}\n`;
        message += `読み取り: ${retrieved.granted ? '✅' : '❌'}\n`;
        message += `データ整合性: ${JSON.stringify(testPermission) === JSON.stringify(retrieved) ? '✅' : '❌'}\n\n`;

        // クリーンアップ
        localStorage.removeItem('localNetworkPermission_test');

        // セッション間の永続性テスト（シミュレーション）
        message += 'セッション永続性シミュレーション:\n';
        const sessionData = sessionStorage.getItem('localNetworkPermission');
        message += `セッションストレージ: ${sessionData ? '✅ データあり' : '❌ データなし'}\n`;

        // ページリロード永続性の説明
        message += '\n📝 永続性レベル:\n';
        message += '1. セッション内: JavaScript変数 (一時的)\n';
        message += '2. タブ内: sessionStorage (タブ終了まで)\n';
        message += '3. ブラウザ内: localStorage (手動削除まで)\n';
        message += '4. サイト設定: ブラウザ設定 (最も永続的)\n\n';

        message += '⚠️ 実際のブラウザポリシーでは、サイト設定レベルでの\n';
        message += '許可管理が行われる場合があります。';

        showResult(message, 'info');

    } catch (error) {
        showResult(`永続性テストエラー: ${error.message}`, 'error');
    }
}

// ==================================================================
// 共通テスト機能
// ==================================================================

/**
 * 現在の許可状態でテスト実行
 */
async function testWithCurrentPermission() {
    if (!userPermissionState.granted) {
        showResult('テスト実行前に許可要求を行ってください。', 'warning');
        return;
    }

    console.log('[Test] 現在の許可状態でテストを実行中...');
    showResult('許可済み状態での総合テストを実行中...', 'info');

    try {
        const results = [];

        for (const target of testTargets.slice(0, 3)) { // 最初の3つでテスト
            const result = await performNetworkRequest(target.url, true);
            results.push({
                url: target.url,
                description: target.description,
                result: result
            });

            await new Promise(resolve => setTimeout(resolve, 250));
        }

        const analysis = analyzePermissionResults(results);

        let message = `許可済み状態テスト結果:\n\n`;
        message += `許可状態: ${userPermissionState.granted ? '✅ 許可済み' : '❌ 拒否済み'}\n`;
        message += `成功率: ${(analysis.successCount / results.length * 100).toFixed(1)}%\n`;
        message += `平均応答時間: ${analysis.avgResponseTime}ms\n\n`;

        message += '個別結果:\n';
        results.forEach(result => {
            const status = result.result.blocked ? '❌' : '✅';
            message += `${status} ${result.url}\n`;
            message += `   ${result.description} (${result.result.responseTime}ms)\n`;
        });

        const resultType = analysis.successCount > analysis.blockCount ? 'success' : 'warning';
        showResult(message, resultType);

    } catch (error) {
        showResult(`テスト実行エラー: ${error.message}`, 'error');
    }
}

/**
 * 許可状態をリセット
 */
function resetPermissions() {
    console.log('[Reset] 許可状態をリセット中...');

    // メモリ上の状態をリセット
    userPermissionState = {
        granted: false,
        timestamp: null,
        grantedUrls: [],
        deniedUrls: [],
        sessionActive: false
    };

    // ストレージからも削除
    localStorage.removeItem('localNetworkPermission');
    sessionStorage.removeItem('localNetworkPermission');

    // UI更新
    updatePermissionStatus('リセット済み', 'unknown');
    document.getElementById('testWithPermissionBtn').disabled = true;

    // ステップインジケーターをリセット
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.classList.remove('step-completed');
        }
    }

    showResult('✅ 許可状態が正常にリセットされました。\n\n新しい許可要求から開始できます。', 'success');

    console.log('[Reset] 許可状態リセット完了');
}

// ==================================================================
// ユーティリティ関数
// ==================================================================

/**
 * ネットワーク要求の実行
 */
async function performNetworkRequest(url, usePermission) {
    const startTime = Date.now();

    return new Promise((resolve) => {
        // 許可チェック
        if (usePermission && !userPermissionState.granted) {
            resolve({
                blocked: true,
                message: '許可が必要です',
                responseTime: 0
            });
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        fetch(url, {
            method: 'GET',
            mode: 'no-cors',
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

                let blocked = false;
                let message = '';

                if (error.name === 'AbortError') {
                    message = 'タイムアウト (5秒)';
                } else if (error.message.includes('Failed to fetch')) {
                    blocked = true;
                    message = `ネットワークエラー - 要求がブロックされた可能性 (${endTime - startTime}ms)`;
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

/**
 * 許可結果の分析
 */
function analyzePermissionResults(results) {
    const successCount = results.filter(r => !r.result.blocked).length;
    const blockCount = results.filter(r => r.result.blocked).length;
    const errorCount = results.filter(r => r.result.error).length;

    const responseTimes = results.map(r => r.result.responseTime);
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const fastestTime = Math.min(...responseTimes);
    const slowestTime = Math.max(...responseTimes);

    return {
        successCount,
        blockCount,
        errorCount,
        avgResponseTime,
        fastestTime,
        slowestTime
    };
}

/**
 * ステップの完了マーク
 */
function markStepCompleted(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
        step.classList.add('step-completed');
    }
}

// ==================================================================
// イベントリスナー
// ==================================================================

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function () {
    console.log('[UserPermissionTest] ユーザー許可テストモジュール初期化完了');

    // 保存された許可状態の復元
    const storedPermission = localStorage.getItem('localNetworkPermission');
    if (storedPermission) {
        try {
            userPermissionState = JSON.parse(storedPermission);
            console.log('[UserPermissionTest] 許可状態を復元:', userPermissionState);
        } catch (error) {
            console.error('[UserPermissionTest] 許可状態復元エラー:', error);
        }
    }
});
