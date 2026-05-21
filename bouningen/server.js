// server.js
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3000 });
let players = {};

console.log("WebSocket サーバーがポート 3000 で起動しました！");

wss.on('connection', (ws) => {
    const playerId = Math.random().toString(36).substring(2, 9);
    console.log(`プレイヤーが接続しました。ID: ${playerId}`);

    players[playerId] = { x: 200, y: 300, hp: 100, direction: 1, wins: 0, loses: 0, isGaming: false, room: null };

    ws.send(JSON.stringify({ type: 'init', id: playerId }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            if (message.type === 'join_room') {
                players[playerId].room = message.roomName;
                players[playerId].isGaming = true;
                players[playerId].hp = 100;
                broadcastToRoom(message.roomName);
            }

            else if (message.type === 'move') {
                players[playerId].x = message.x;
                players[playerId].y = message.y;
                players[playerId].direction = message.direction;
                
                if (players[playerId].room) {
                    broadcastToRoom(players[playerId].room);
                }
            }
            
            else if (message.type === 'hit') {
                const targetId = message.targetId;
                const currentRoom = players[playerId].room;

                if (currentRoom && players[playerId].isGaming && players[targetId] && players[targetId].isGaming && players[targetId].hp > 0) {
                    players[targetId].hp -= 10;
                    
                    if (players[targetId].hp <= 0) {
                        players[targetId].hp = 0;
                        players[targetId].loses += 1;
                        players[playerId].wins += 1;
                        
                        players[playerId].isGaming = false;
                        players[targetId].isGaming = false;

                        wss.clients.forEach((client) => {
                            if (client.readyState === 1) {
                                client.send(JSON.stringify({
                                    type: 'game_over',
                                    winnerId: playerId,
                                    loserId: targetId,
                                    players: players
                                }));
                            }
                        });
                        return;
                    }
                    broadcastToRoom(currentRoom);
                }
            }
        } catch (e) {
            console.error("データ解析エラー", e);
        }
    });

    // 🔴 プレイヤーが切断したときの処理を強化
    ws.on('close', () => {
        console.log(`プレイヤーが切断しました。ID: ${playerId}`);
        
        const disconnectedPlayer = players[playerId];
        
        if (disconnectedPlayer) {
            const currentRoom = disconnectedPlayer.room;
            
            // 【新機能】もし対戦中（isGaming === true）のまま切断したらペナルティ
            if (disconnectedPlayer.isGaming && currentRoom) {
                disconnectedPlayer.loses += 1; // 切断した人を負け+1
                disconnectedPlayer.isGaming = false;

                // 同じ部屋に残っている「まだ対戦中」の相手を探す
                let opponentId = null;
                for (let id in players) {
                    if (id !== playerId && players[id].room === currentRoom && players[id].isGaming) {
                        opponentId = id;
                        break;
                    }
                }

                // 相手が見つかったら、その相手を「不戦勝」にする
                if (opponentId) {
                    players[opponentId].wins += 1; // 残された人を勝ち+1
                    players[opponentId].isGaming = false;

                    // 残されたプレイヤーに「相手の切断による勝利」を通知
                    wss.clients.forEach((client) => {
                        if (client.readyState === 1) {
                            client.send(JSON.stringify({
                                type: 'opponent_disconnected',
                                winnerId: opponentId,
                                loserId: playerId,
                                players: players
                            }));
                        }
                    });
                }
            }

            // メモリから削除
            delete players[playerId];
            if (currentRoom) {
                broadcastToRoom(currentRoom);
            }
        }
    });
});

function broadcastToRoom(roomName) {
    const broadcastData = JSON.stringify({ type: 'update', players: players });
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(broadcastData);
        }
    });
}