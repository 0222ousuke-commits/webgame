<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>一から作るオンライン2Dゲーム - クリック攻撃対応版</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body {
            background-color: #111; margin: 0; padding: 0;
            display: flex; justify-content: center; align-items: center; height: 100vh;
            font-family: 'Helvetica Neue', Arial, sans-serif; overflow: hidden;
            user-select: none; -webkit-user-select: none;
        }
        #gameContainer { position: relative; width: 1280px; height: 720px; box-shadow: 0 0 30px rgba(0, 0, 0, 0.7); margin: 0 auto; }
        canvas { background: #222; position: absolute; top: 0; left: 0; }
        
        /* ホーム画面のUI */
        #screen-title {
            position: absolute; top: 0; left: 0; width: 1280px; height: 720px;
            background: linear-gradient(135deg, #111a2e 0%, #0a0f1d 100%);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            z-index: 10; transition: opacity 0.5s;
        }

        #screen-title h1 { color: #FF5733; font-size: 54px; margin: 0 0 40px 0; text-shadow: 0 0 20px rgba(255, 87, 51, 0.4); letter-spacing: 4px; }

        /* 左上ステータス表示 */
        .status-panel {
            position: absolute; top: 20px; left: 20px;
            background: rgba(255,255,255,0.05); padding: 15px 25px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1); color: #fff;
        }
        .status-panel h3 { margin: 0 0 8px 0; color: #ffaa44; font-size: 16px; }
        .status-panel p { margin: 4px 0; font-size: 18px; font-weight: bold; }
        .gold-display { color: #f1c40f; font-size: 20px; text-shadow: 0 0 10px rgba(241,196,15,0.3); }

        /* 右上設定ボタンと設定パネル */
        .btn-settings {
            position: absolute; top: 20px; right: 20px;
            background: #34495e; color: white; border: none; padding: 12px 20px;
            font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; z-index: 15;
            transition: background 0.2s;
        }
        .btn-settings:hover { background: #415b76; }
        
        .settings-panel {
            position: absolute; top: 75px; right: 20px;
            background: rgba(10, 15, 29, 0.95); border: 2px solid #444; border-radius: 12px;
            padding: 20px; width: 240px; color: white; z-index: 15; display: none;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .settings-panel h3 { margin: 0 0 15px 0; border-bottom: 1px solid #333; padding-bottom: 5px; color: #3498db; }
        .setting-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        
        /* トグルスイッチの見た目 */
        .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #2ecc71; }
        input:checked + .slider:before { transform: translateX(24px); }

        /* メインメニューのコンテナ */
        .menu-container { display: flex; gap: 40px; align-items: flex-start; }

        /* モード選択ボタン */
        .mode-select { display: flex; flex-direction: column; gap: 20px; }
        
        /* オンライン用サブメニュー */
        .online-sub-menu { display: none; flex-direction: column; gap: 15px; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid #333; width: 280px; box-sizing: border-box; }
        .input-code { background: #111; border: 2px solid #444; color: white; padding: 10px; font-size: 16px; border-radius: 8px; text-align: center; font-weight: bold; }
        .input-code:focus { border-color: #FF5733; outline: none; }
        .btn-sub { padding: 12px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; background: #222; color: #fff; border: 1px solid #555; transition: all 0.2s; }
        .btn-sub:hover { background: #333; border-color: #FF5733; }

        .btn-menu {
            background: #222; color: white; border: 2px solid #444; padding: 20px 40px;
            font-size: 20px; font-weight: bold; border-radius: 15px; cursor: pointer;
            width: 280px; transition: all 0.2s; text-align: center; box-sizing: border-box;
        }
        .btn-menu:hover { border-color: #FF5733; background: #1a1515; transform: translateY(-2px); }
        .btn-primary { background: #FF5733; border: none; box-shadow: 0 5px 15px rgba(255, 87, 51, 0.3); }
        .btn-primary:hover { background: #ff6e4a; }

        /* 武器ショップ */
        .shop-panel {
            background: rgba(0, 0, 0, 0.4); border: 2px solid #333; border-radius: 15px;
            padding: 20px; width: 340px; color: white;
        }
        .shop-panel h2 { margin: 0 0 15px 0; font-size: 20px; color: #2ecc71; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .weapon-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px; background: #222; margin-bottom: 10px; border-radius: 8px; border: 1px solid #444;
        }
        .weapon-info { display: flex; flex-direction: column; gap: 2px; }
        .weapon-price { font-size: 12px; color: #f1c40f; }
        .weapon-item span { font-weight: bold; }
        .btn-buy { background: #2ecc71; border: none; color: white; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; min-width: 75px; }
        .btn-buy:hover { background: #27ae60; }
        .btn-buy.equipped { background: #7f8c8d; cursor: default; }

        /* アナウンス表示 */
        #game-announce {
            position: absolute; top: 220px; width: 100%; text-align: center;
            color: #fff; font-size: 64px; font-weight: bold; text-shadow: 0 0 20px rgba(0,0,0,0.8);
            z-index: 5; display: none; pointer-events: none;
        }

        /* スマホ用バーチャルパッド */
        #mobile-controls {
            position: absolute; bottom: 30px; left: 0; width: 1280px;
            display: none; justify-content: space-between; padding: 0 60px; box-sizing: border-box;
            z-index: 8; pointer-events: none;
        }
        .ctrl-group { display: flex; gap: 25px; pointer-events: auto; }
        .v-btn {
            width: 90px; height: 90px; background: rgba(255, 255, 255, 0.15);
            border: 3px solid rgba(255, 255, 255, 0.4); border-radius: 50%;
            color: white; font-size: 28px; font-weight: bold;
            display: flex; justify-content: center; align-items: center;
            cursor: pointer; touch-action: none; transition: background 0.1s;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .v-btn:active { background: rgba(255, 255, 255, 0.4); transform: scale(0.95); }
        .btn-attack { background: rgba(231, 76, 60, 0.4); border-color: rgba(231, 76, 60, 0.6); }
        .btn-attack:active { background: rgba(231, 76, 60, 0.7); }

        /* ポーズ画面 */
        #screen-pause {
            position: absolute; top: 0; left: 0; width: 1280px; height: 720px;
            background: rgba(10, 15, 29, 0.85);
            display: none; flex-direction: column; justify-content: center; align-items: center;
            z-index: 20;
        }
        #screen-pause h2 { color: #f1c40f; font-size: 48px; margin: 0 0 10px 0; text-shadow: 0 0 15px rgba(241, 196, 15, 0.4); }
        #screen-pause p { color: #aaa; margin: 0 0 40px 0; font-size: 16px; }
        .pause-menu { display: flex; flex-direction: column; gap: 20px; }
        .btn-pause-choice {
            background: #222; color: white; border: 2px solid #555; padding: 15px 40px;
            font-size: 18px; font-weight: bold; border-radius: 10px; cursor: pointer;
            width: 280px; transition: all 0.2s; text-align: center; box-sizing: border-box;
        }
        .btn-pause-choice:hover { border-color: #f1c40f; background: #2d2515; }
        .btn-danger { border-color: #cc3f29; }
        .btn-danger:hover { border-color: #e74c3c; background: #351c1c; }
    </style>
</head>
<body>

    <div id="gameContainer">
        <canvas id="gameCanvas" width="1280" height="720"></canvas>
        <div id="game-announce">GAME OVER</div>

        <!-- 右上の設定ボタンとパネル -->
        <button class="btn-settings" id="settingsBtn" onclick="toggleSettingsMenu()">設定 ⚙</button>
        <div class="settings-panel" id="settingsPanel">
            <h3>GAME SETTINGS</h3>
            <div class="setting-row">
                <span>スマホモード</span>
                <label class="switch">
                    <input type="checkbox" id="mobileModeCheckbox" onchange="onMobileModeToggle(this)">
                    <span class="slider"></span>
                </label>
            </div>
            <p style="font-size: 11px; color: #aaa; margin: 10px 0 0 0; text-align: center; line-height: 1.4;">
                試合中 [Q] キーでポーズ<br>
                左クリック / [Z]キーで攻撃<br>
                <span style="color:#2ecc71;">※データはブラウザに自動セーブ</span>
            </p>
        </div>

        <!-- スマホ用バーチャルパッド -->
        <div id="mobile-controls">
            <div class="ctrl-group">
                <div class="v-btn" id="v-left">◀</div>
                <div class="v-btn" id="v-right">▶</div>
            </div>
            <div class="ctrl-group">
                <div class="v-btn btn-attack" id="v-attack">⚔</div>
                <div class="v-btn" id="v-jump">▲</div>
            </div>
        </div>

        <!-- ポーズ画面のUI -->
        <div id="screen-pause">
            <h2>PAUSED</h2>
            <p id="pause-penalty-text">※オンライン試合中にタイトルに戻ると「敗北」になります</p>
            <div class="pause-menu">
                <button class="btn-pause-choice" onclick="resumeGame()">ゲームに戻る (Q)</button>
                <button class="btn-pause-choice btn-danger" onclick="quitMatch()">タイトルに戻る</button>
            </div>
        </div>

        <!-- タイトル・ホーム画面 -->
        <div id="screen-title">
            <div class="status-panel">
                <h3>PLAYER STATUS</h3>
                <p>オンライン勝利: <span id="stat-wins">0</span></p>
                <p>オンライン敗北: <span id="stat-loses">0</span></p>
                <p class="gold-display">所持金: <span id="stat-gold">0</span> G</p>
                <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:8px 0;">
                <p>現在の武器: <span id="stat-weapon" style="color:#2ecc71">ノーマル</span></p>
                <p id="room-display" style="color:#3498db; font-size:14px; margin-top:10px; display:none;">部屋: <span id="current-room-text">-</span></p>
            </div>

            <h1>2D ONLINE ACTION</h1>
            
            <div class="menu-container">
                <div class="mode-select">
                    <button class="btn-menu btn-primary" id="btn-online-main" onclick="toggleOnlineMenu()">オンライン対戦 ▽</button>
                    
                    <div class="online-sub-menu" id="onlineMenu">
                        <button class="btn-sub" style="background:#ff5733; border:none;" onclick="startBattle('online', 'RANDOM_ROOM')">ランダムオンラインバトル</button>
                        <hr style="border:0; border-top:1px solid #333; margin:5px 0;">
                        <input type="text" class="input-code" id="roomCodeInput" placeholder="コードを入力" maxlength="10">
                        <button class="btn-sub" onclick="joinWithCode()">コードを打ってバトル</button>
                    </div>

                    <button class="btn-menu" id="btn-cpu-main" onclick="startBattle('cpu')">コンピューターと対戦 (練習)</button>
                </div>

                <div class="shop-panel">
                    <h2>WEAPON SHOP</h2>
                    <div class="weapon-item">
                        <div class="weapon-info">
                            <span>ノーマル</span>
                            <span class="weapon-price" style="color:#aaa;">初期装備 / 威力10</span>
                        </div>
                        <button class="btn-buy equipped" id="btn-w1" onclick="equipNormalWeapon()">装備中</button>
                    </div>
                    <div class="weapon-item">
                        <div class="weapon-info">
                            <span>ビームソード</span>
                            <span class="weapon-price" id="price-w2">価格: 300 G / 威力20</span>
                        </div>
                        <button class="btn-buy" id="btn-w2" onclick="buyOrEquipBeamSword()">購入</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        let gameState = 'title'; 
        let battleMode = 'online'; 
        let myRoomName = null; 

        let onlineState = 'waiting'; 
        let countdownTimer = 5; 
        let countdownIntervalId = null;

        let isMobileMode = false;

        // セーブ対象のプレイヤーデータ構造
        let playerSaveData = {
            wins: 0,
            loses: 0,
            gold: 500,               
            hasBeamSword: false,     
            currentWeapon: "ノーマル" 
        };

        // ローカルストレージからセーブデータを読み込む関数
        function loadGameData() {
            const saved = localStorage.getItem("2d_action_game_save");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    playerSaveData = Object.assign(playerSaveData, parsed);
                } catch(e) {
                    console.error("セーブデータの読み込みに失敗しました。初期化します。", e);
                }
            }
            updateUI(); 
        }

        // ローカルストレージへセーブデータを書き込む関数
        function saveGameData() {
            localStorage.setItem("2d_action_game_save", JSON.stringify(playerSaveData));
            updateUI();
        }

        // セーブデータの内容をHTML画面に反映する関数
        function updateUI() {
            document.getElementById("stat-wins").innerText = playerSaveData.wins;
            document.getElementById("stat-loses").innerText = playerSaveData.loses;
            document.getElementById("stat-gold").innerText = playerSaveData.gold;
            document.getElementById("stat-weapon").innerText = playerSaveData.currentWeapon;

            const btnW1 = document.getElementById("btn-w1");
            const btnW2 = document.getElementById("btn-w2");
            const priceW2 = document.getElementById("price-w2");

            if (playerSaveData.currentWeapon === "ノーマル") {
                btnW1.innerText = "装備中";
                btnW1.classList.add("equipped");
            } else {
                btnW1.innerText = "使う";
                btnW1.classList.remove("equipped");
            }

            if (playerSaveData.hasBeamSword) {
                priceW2.innerText = "購入済み / 威力20";
                if (playerSaveData.currentWeapon === "ビームソード") {
                    btnW2.innerText = "装備中";
                    btnW2.classList.add("equipped");
                } else {
                    btnW2.innerText = "使う";
                    btnW2.classList.remove("equipped");
                }
            } else {
                priceW2.innerText = "価格: 300 G / 威力20";
                btnW2.innerText = "300G購入";
                btnW2.classList.remove("equipped");
            }
        }

        const socket = new WebSocket('ws://localhost:3000');
        let myId = null;
        let onlinePlayers = {};

        let attackPower = 10;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
                myId = data.id;
                syncStatsWithServer();
            } else if (data.type === 'update') {
                onlinePlayers = data.players;
                
                if ((gameState === 'playing' || gameState === 'paused') && battleMode === 'online') {
                    let playerCountInRoom = 0;
                    for (let id in onlinePlayers) {
                        if (onlinePlayers[id].room === myRoomName) {
                            playerCountInRoom++;
                        }
                    }
                    if (playerCountInRoom >= 2 && onlineState === 'waiting') {
                        startMatchCountdown();
                    }
                }

            } else if (data.type === 'game_over') {
                onlinePlayers = data.players;
                onlineState = 'finished';
                if (countdownIntervalId) clearInterval(countdownIntervalId);
                if (gameState === 'paused') resumeGame();

                if (data.winnerId === myId) {
                    playerSaveData.wins += 1;
                    playerSaveData.gold += 150; 
                    saveGameData();
                    showGameOverAnnounce("YOU WIN!\n+150 GOLD 獲得");
                } else {
                    playerSaveData.loses += 1;
                    playerSaveData.gold += 30;  
                    saveGameData();
                    showGameOverAnnounce("YOU LOSE...\n+30 GOLD 獲得");
                }
                syncStatsWithServer();
            }
            
            else if (data.type === 'opponent_disconnected') {
                onlinePlayers = data.players;
                onlineState = 'finished';
                if (countdownIntervalId) clearInterval(countdownIntervalId);
                if (gameState === 'paused') resumeGame();

                playerSaveData.wins += 1;
                playerSaveData.gold += 100; 
                saveGameData();
                syncStatsWithServer();

                showGameOverAnnounce("相手が切断しました\n不戦勝！ +100 GOLD");
            }
        };

        function syncStatsWithServer() {
            if (socket.readyState === WebSocket.OPEN && myId) {
                socket.send(JSON.stringify({ 
                    type: 'sync_stats', 
                    wins: playerSaveData.wins, 
                    loses: playerSaveData.loses 
                }));
            }
        }

        let player = {
            x: 200, y: 300, width: 40, height: 40, speed: 7,
            vy: 0, jumpPower: -15, isGrounded: false,
            direction: 1, isAttacking: false, attackTimer: 0, hp: 100
        };

        let cpu = {
            x: 900, y: 300, width: 40, height: 40, speed: 3,
            vy: 0, direction: -1, hp: 100, isGrounded: false
        };

        const gravity = 0.6;
        const groundY = canvas.height - 50; 
        const platforms = [{ x: 400, y: 500, width: 200, height: 30 }, { x: 700, y: 350, width: 200, height: 30 }];
        let keys = {};

        // 🖱️ 【変更点】ゲーム画面（Canvas）内での左クリックを検知して攻撃
        canvas.addEventListener("mousedown", (e) => {
            // 左クリック（ボタンコードが0）かつゲームプレイ中の場合のみ実行
            if (e.button === 0 && gameState === 'playing') {
                triggerAttack();
            }
        });

        // キー入力処理
        window.addEventListener("keydown", (e) => {
            let keyName = e.key.toUpperCase();
            if (e.key === " ") keyName = " ";
            if (e.key.startsWith("Arrow")) keyName = e.key;

            if (keyName === "Q") {
                if (gameState === 'playing') {
                    pauseGame();
                    return;
                } else if (gameState === 'paused') {
                    resumeGame();
                    return;
                }
            }

            if (gameState === 'paused') return;

            keys[keyName] = true;
            if (keyName === "Z") triggerAttack(); // 従来のZキーでも攻撃可能
        });
        
        window.addEventListener("keyup", (e) => {
            let keyName = e.key.toUpperCase();
            if (e.key === " ") keyName = " ";
            if (e.key.startsWith("Arrow")) keyName = e.key;
            keys[keyName] = false;
        });

        function pauseGame() {
            gameState = 'paused';
            document.getElementById("screen-pause").style.display = "flex";
            document.getElementById("mobile-controls").style.display = "none";

            const penaltyText = document.getElementById("pause-penalty-text");
            if (battleMode === 'online' && (onlineState === 'countdown' || onlineState === 'fighting')) {
                penaltyText.innerText = "⚠️ 今タイトルに戻ると【敗北数+1】のペナルティを受けます";
                penaltyText.style.color = "#e74c3c";
            } else {
                penaltyText.innerText = "※この試合を抜けてもペナルティはありません";
                penaltyText.style.color = "#aaa";
            }
        }

        function resumeGame() {
            gameState = 'playing';
            document.getElementById("screen-pause").style.display = "none";
            updateMobileControlsVisibility();
        }

        function quitMatch() {
            document.getElementById("screen-pause").style.display = "none";

            if (battleMode === 'online' && (onlineState === 'countdown' || onlineState === 'fighting')) {
                playerSaveData.loses += 1;
                saveGameData();
                syncStatsWithServer();

                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'hit', targetId: myId, forceKill: true })); 
                }
                
                if (countdownIntervalId) clearInterval(countdownIntervalId);
                showGameOverAnnounce("途中で脱走したため\n敗北となりました");
            } else {
                if (countdownIntervalId) clearInterval(countdownIntervalId);
                if (battleMode === 'online' && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'join_room', roomName: 'LOBBY' }));
                }
                backToTitleImmediate();
            }
        }

        function backToTitleImmediate() {
            const titleScreen = document.getElementById("screen-title");
            titleScreen.style.display = "flex";
            titleScreen.style.opacity = 1;
            gameState = 'title';
            document.getElementById("onlineMenu").style.display = "none";
            document.getElementById("settingsBtn").style.display = "block";
            document.getElementById("mobile-controls").style.display = "none";
            updateUI();
        }

        function toggleSettingsMenu() {
            const panel = document.getElementById("settingsPanel");
            panel.style.display = (panel.style.display === "block") ? "none" : "block";
        }

        function onMobileModeToggle(checkbox) {
            isMobileMode = checkbox.checked;
            updateMobileControlsVisibility();
        }

        function updateMobileControlsVisibility() {
            const ctrl = document.getElementById("mobile-controls");
            if (isMobileMode && gameState === 'playing') {
                ctrl.style.display = "flex";
            } else {
                ctrl.style.display = "none";
            }
        }

        function triggerAttack() {
            if (gameState === 'playing' && !player.isAttacking) {
                if (battleMode === 'cpu' || (battleMode === 'online' && onlineState === 'fighting')) {
                    player.isAttacking = true;
                    player.attackTimer = 10;
                    checkAttackHit();
                }
            }
        }

        // バーチャルパッドのイベント登録
        const setupMobileButton = (id, keyString, isAttackBtn = false, isJumpBtn = false) => {
            const btn = document.getElementById(id);
            
            const press = (e) => {
                e.preventDefault();
                if (gameState === 'paused') return;
                if (isAttackBtn) {
                    triggerAttack();
                } else {
                    keys[keyString] = true;
                }
            };
            
            const release = (e) => {
                e.preventDefault();
                if (!isAttackBtn) keys[keyString] = false;
            };

            btn.addEventListener("touchstart", press);
            btn.addEventListener("touchend", release);
            btn.addEventListener("touchcancel", release);
            
            // バーチャルパッドをPCでテストする場合用のマウス対応
            btn.addEventListener("mousedown", (e) => {
                e.stopPropagation(); // Canvasクリック攻撃とバッティングしないように防止
                press(e);
            });
            btn.addEventListener("mouseup", release);
            btn.addEventListener("mouseleave", release);
        };

        setupMobileButton("v-left", "A");
        setupMobileButton("v-right", "D");
        setupMobileButton("v-jump", "W", false, true);
        setupMobileButton("v-attack", "Z", true, false);


        function toggleOnlineMenu() {
            const menu = document.getElementById("onlineMenu");
            menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
        }

        function joinWithCode() {
            const code = document.getElementById("roomCodeInput").value.trim();
            if (code === "") {
                alert("コードを入力してください！");
                return;
            }
            startBattle('online', "ROOM_" + code);
        }

        function equipNormalWeapon() {
            playerSaveData.currentWeapon = "ノーマル";
            attackPower = 10;
            saveGameData();
        }

        function buyOrEquipBeamSword() {
            if (playerSaveData.hasBeamSword) {
                playerSaveData.currentWeapon = "ビームソード";
                attackPower = 20;
                saveGameData();
            } else {
                if (playerSaveData.gold >= 300) {
                    playerSaveData.gold -= 300; 
                    playerSaveData.hasBeamSword = true;
                    playerSaveData.currentWeapon = "ビームソード";
                    attackPower = 20;
                    saveGameData();
                    alert("ビームソード（威力20）を購入し、装備しました！");
                } else {
                    alert("ゴールドが足りません！ (価格: 300 G)");
                }
            }
        }

        function startBattle(mode, roomName = null) {
            battleMode = mode;
            player.hp = 100;
            player.vy = 0;
            player.isAttacking = false;
            
            attackPower = (playerSaveData.currentWeapon === "ビームソード") ? 20 : 10;

            document.getElementById("settingsPanel").style.display = "none";
            document.getElementById("settingsBtn").style.display = "none";

            if (mode === 'cpu') {
                myRoomName = null;
                document.getElementById("room-display").style.display = "none";
                player.x = 200;
                player.y = 300;
                cpu.hp = 100;
                cpu.x = 900;
                cpu.y = 300;
                cpu.vy = 0;
                document.getElementById("game-announce").style.display = "none";
            } else {
                onlineState = 'waiting';
                countdownTimer = 5;
                myRoomName = roomName;

                player.x = (Math.random() > 0.5) ? 200 : 1000;
                player.y = 300;

                let displayText = roomName === 'RANDOM_ROOM' ? 'ランダムマッチ' : roomName.replace('ROOM_', 'コード: ');
                document.getElementById("current-room-text").innerText = displayText;
                document.getElementById("room-display").style.display = "block";

                const announce = document.getElementById("game-announce");
                announce.innerText = "対戦相手を待っています...";
                announce.style.color = "#aaa";
                announce.style.fontSize = "40px";
                announce.style.display = "block";

                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'join_room', roomName: roomName }));
                    socket.send(JSON.stringify({ type: 'move', x: player.x, y: player.y, direction: player.direction }));
                }
            }

            const titleScreen = document.getElementById("screen-title");
            titleScreen.style.opacity = 0;
            setTimeout(() => { 
                titleScreen.style.display = "none"; 
                gameState = 'playing'; 
                updateMobileControlsVisibility();
            }, 500);
        }

        function startMatchCountdown() {
            onlineState = 'countdown';
            countdownTimer = 5;
            const announce = document.getElementById("game-announce");
            announce.style.fontSize = "70px";
            announce.style.color = "#f1c40f"; 
            announce.innerText = "READY... " + countdownTimer;

            if (countdownIntervalId) clearInterval(countdownIntervalId);
            
            countdownIntervalId = setInterval(() => {
                countdownTimer--;
                if (countdownTimer > 0) {
                    announce.innerText = "READY... " + countdownTimer;
                } else if (countdownTimer === 0) {
                    announce.innerText = "BATTLE START!!!";
                    announce.style.color = "#e74c3c"; 
                    onlineState = 'fighting'; 
                } else {
                    if (gameState !== 'paused') {
                        announce.style.display = "none";
                    }
                    clearInterval(countdownIntervalId);
                }
            }, 1000);
        }

        function showGameOverAnnounce(text) {
            const announce = document.getElementById("game-announce");
            announce.innerHTML = text.replace("\n", "<br>");
            
            if (text.includes("WIN") || text.includes("切断") || text.includes("GOLD")) {
                announce.style.color = "#2ecc71";
            } else {
                announce.style.color = "#e74c3c";
            }
            
            announce.style.fontSize = text.includes("切断") || text.includes("脱走") || text.includes("GOLD") ? "44px" : "64px";
            announce.style.display = "block";

            document.getElementById("mobile-controls").style.display = "none";

            setTimeout(() => {
                announce.style.display = "none";
                backToTitleImmediate();
            }, 3000); 
        }

        function checkAttackHit() {
            let attackWidth = playerSaveData.currentWeapon === "ビームソード" ? 80 : 50; 
            let attackHeight = 30;
            let attackX = player.direction === 1 ? player.x + player.width : player.x - attackWidth;
            let attackY = player.y + 5;

            if (battleMode === 'cpu') {
                if (cpu.hp <= 0) return;
                let hitX = attackX + attackWidth > cpu.x && attackX < cpu.x + cpu.width;
                let hitY = attackY + attackHeight > cpu.y && attackY < cpu.y + cpu.height;
                if (hitX && hitY) {
                    cpu.hp -= attackPower; 
                    if (cpu.hp <= 0) {
                        cpu.hp = 0;
                        
                        playerSaveData.wins += 1;
                        playerSaveData.gold += 50; 
                        saveGameData();

                        showGameOverAnnounce("YOU WIN! (CPU戦)\n+50 GOLD 獲得");
                    }
                }
            } else {
                for (let id in onlinePlayers) {
                    if (id === myId || onlinePlayers[id].hp <= 0) continue;
                    let target = onlinePlayers[id];
                    if (target.room !== myRoomName) continue;

                    let hitX = attackX + attackWidth > target.x && attackX < target.x + 40;
                    let hitY = attackY + attackHeight > target.y && attackY < target.y + 40;
                    if (hitX && hitY) {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ type: 'hit', targetId: id }));
                        }
                    }
                }
            }
        }

        function gameLoop() {
            if (gameState === 'playing') {
                let oldX = player.x; let oldY = player.y; let oldDir = player.direction;
                let canMove = (battleMode === 'cpu') || (battleMode === 'online' && onlineState === 'fighting');

                if (canMove) {
                    if (keys["ArrowLeft"] || keys["A"]) { player.x -= player.speed; player.direction = -1; }
                    if (keys["ArrowRight"] || keys["D"]) { player.x += player.speed; player.direction = 1; }
                }

                if (player.isAttacking) { player.attackTimer--; if (player.attackTimer <= 0) player.isAttacking = false; }
                
                player.vy += gravity; player.y += player.vy; player.isGrounded = false;
                if (player.y + player.height >= groundY) { player.y = groundY - player.height; player.vy = 0; player.isGrounded = true; }
                for (let block of platforms) {
                    let hitX = player.x + player.width > block.x && player.x < block.x + block.width;
                    let hitY = player.y + player.height > block.y && player.y < block.y + block.height;
                    if (hitX && hitY && player.vy > 0 && player.y + player.height - player.vy <= block.y) {
                        player.y = block.y - player.height; player.vy = 0; player.isGrounded = true;
                    }
                }
                if (player.x < 0) player.x = 0;
                if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
                if (player.y < 0) { player.y = 0; player.vy = 0; }
                
                if ((keys["ArrowUp"] || keys[" "] || keys["W"]) && player.isGrounded && canMove) { 
                    player.vy = player.jumpPower; 
                    player.isGrounded = false; 
                }

                if (battleMode === 'online' && (player.x !== oldX || player.y !== oldY || player.direction !== oldDir)) {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'move', x: player.x, y: player.y, direction: player.direction }));
                    }
                }

                if (battleMode === 'cpu' && cpu.hp > 0) {
                    if (cpu.x < player.x) { cpu.x += cpu.speed; cpu.direction = 1; }
                    else if (cpu.x > player.x) { cpu.x -= cpu.speed; cpu.direction = -1; }

                    cpu.vy += gravity; cpu.y += cpu.vy;
                    if (cpu.y + cpu.height >= groundY) { cpu.y = groundY - cpu.height; cpu.vy = 0; }

                    let dist = Math.abs(cpu.x - player.x);
                    if (dist < 50 && Math.random() < 0.02) { 
                        player.hp -= 5;
                        if (player.hp <= 0) {
                            player.hp = 0;
                            
                            playerSaveData.loses += 1;
                            saveGameData();

                            showGameOverAnnounce("YOU LOSE... (CPU戦)");
                        }
                    }
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#444"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();
            ctx.fillStyle = "#2ecc71";
            for (let block of platforms) { ctx.fillRect(block.x, block.y, block.width, block.height); }

            if (gameState === 'playing' || gameState === 'paused') {
                let currentWeapon = playerSaveData.currentWeapon;
                if (battleMode === 'cpu') {
                    ctx.fillStyle = "#FF5733"; ctx.fillRect(player.x, player.y, player.width, player.height);
                    ctx.fillStyle = "#fff"; ctx.fillRect(player.direction === 1 ? player.x + 25 : player.x + 5, player.y + 10, 10, 10);
                    if (player.isAttacking) {
                        ctx.fillStyle = "rgba(231, 76, 60, 0.6)";
                        let attackLen = currentWeapon === "ビームソード" ? 80 : 50;
                        let attX = player.direction === 1 ? player.x + player.width : player.x - attackLen;
                        ctx.fillRect(attX, player.y + 5, attackLen, 30);
                    }
                    ctx.fillStyle = "#000"; ctx.fillRect(player.x - 5, player.y - 15, 50, 6);
                    ctx.fillStyle = "#2ecc71"; ctx.fillRect(player.x - 5, player.y - 15, 50 * (player.hp / 100), 6);

                    if (cpu.hp > 0) {
                        ctx.fillStyle = "#9b59b6"; ctx.fillRect(cpu.x, cpu.y, cpu.width, cpu.height);
                        ctx.fillStyle = "#fff"; ctx.fillRect(cpu.direction === 1 ? cpu.x + 25 : cpu.x + 5, cpu.y + 10, 10, 10);
                        ctx.fillStyle = "#000"; ctx.fillRect(cpu.x - 5, cpu.y - 15, 50, 6);
                        ctx.fillStyle = "#e74c3c"; ctx.fillRect(cpu.x - 5, cpu.y - 15, 50 * (cpu.hp / 100), 6);
                    }
                } else {
                    let amIDrawn = false;
                    for (let id in onlinePlayers) {
                        let pData = onlinePlayers[id];
                        if (pData.room !== myRoomName) continue;

                        let isMe = (id === myId);
                        if (isMe) {
                            pData.hp = player.hp;
                            pData.x = player.x;
                            pData.y = player.y;
                            amIDrawn = true;
                        }

                        ctx.fillStyle = isMe ? "#FF5733" : "#3498db";
                        if (pData.hp <= 0) ctx.fillStyle = "#555";
                        ctx.fillRect(pData.x, pData.y, 40, 40);

                        ctx.fillStyle = "#fff";
                        ctx.fillRect(pData.direction === 1 ? pData.x + 25 : pData.x + 5, pData.y + 10, 10, 10);

                        if (isMe && player.isAttacking) {
                            ctx.fillStyle = "rgba(231, 76, 60, 0.6)";
                            let attackLen = currentWeapon === "ビームソード" ? 80 : 50;
                            let attX = player.direction === 1 ? player.x + player.width : player.x - attackLen;
                            ctx.fillRect(attX, player.y + 5, attackLen, 30);
                        }

                        ctx.fillStyle = "#000"; ctx.fillRect(pData.x - 5, pData.y - 15, 50, 6);
                        ctx.fillStyle = pData.hp > 30 ? "#2ecc71" : "#e74c3c";
                        ctx.fillRect(pData.x - 5, pData.y - 15, 50 * (pData.hp / 100), 6);
                    }

                    if (!amIDrawn) {
                        ctx.fillStyle = "#FF5733"; ctx.fillRect(player.x, player.y, player.width, player.height);
                        ctx.fillStyle = "#fff"; ctx.fillRect(player.direction === 1 ? player.x + 25 : player.x + 5, player.y + 10, 10, 10);
                        ctx.fillStyle = "#000"; ctx.fillRect(player.x - 5, player.y - 15, 50, 6);
                        ctx.fillStyle = "#2ecc71"; ctx.fillRect(player.x - 5, player.y - 15, 50, 6);
                    }
                }
            }

            requestAnimationFrame(gameLoop);
        }

        loadGameData();
        gameLoop();
    </script>
</body>
</html>
