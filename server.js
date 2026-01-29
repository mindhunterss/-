/**
 * 红色引擎 - 党建云平台后端服务器
 * 运行方法：node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'database.json');

// --- 1. 初始化数据库 (文件存储) ---
let DB = {
    users: [{ name: "管理员", user: "xqyydzb", pwd: "888888", role: "admin", status: "active", score: 0, days: 0 }],
    news: [{ id: 1, title: "陕药兴庆党支部召开2026年第一季度党员大会", date: "2026-01-28", content: "内容：学习党的最新文件，部署新一年工作。" }],
    arrange: [{ id: 1, content: "2月5日 14:00 召开全体党员会议（会议室1）" }],
    suggest: []
};

// 如果文件存在，读取旧数据
if (fs.existsSync(DATA_FILE)) {
    DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} else {
    saveDB(); // 不存在则创建
}

function saveDB() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf8');
}

// --- 2. 创建服务器 ---
const server = http.createServer((req, res) => {
    // 允许跨域 (让手机能访问)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 处理静态文件 (logo和html)
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if(err) { res.writeHead(500); res.end('Error'); return;}
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
        });
        return;
    }
    if (req.url === '/logo.png') {
        fs.readFile(path.join(__dirname, 'logo.png'), (err, content) => {
            if(err) { res.writeHead(404); res.end(); return;}
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(content);
        });
        return;
    }

    // --- API 接口 (处理数据请求) ---
    
    // 读取数据
    if (req.url === '/api/get_data' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(DB));
        return;
    }

    // 保存/更新数据 (通用接口)
    if (req.url === '/api/update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const newData = JSON.parse(body);
                // 更新内存数据
                if(newData.type === 'register') {
                    // 检查重名
                    if(DB.users.find(u=>u.user === newData.data.user)) {
                        res.writeHead(400); res.end('用户已存在'); return;
                    }
                    DB.users.push(newData.data);
                } else if(newData.type === 'sync_all') {
                    // 管理员全量更新 (简单粗暴但有效)
                    if(newData.key) DB[newData.key] = newData.data;
                } else if(newData.type === 'update_user') {
                    // 更新单个用户(积分/状态)
                    const idx = DB.users.findIndex(u=>u.user === newData.data.user);
                    if(idx !== -1) DB.users[idx] = newData.data;
                }
                
                saveDB(); // 写入硬盘
                res.writeHead(200); res.end('ok');
            } catch (e) {
                res.writeHead(500); res.end('error');
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// --- 3. 启动 ---
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n>>> 党建服务器已启动! <<<`);
    console.log(`1. 管理员请在电脑浏览器访问: http://localhost:${PORT}`);
    console.log(`2. 手机请连接同一WiFi，访问: http://[您的电脑IP]:${PORT}`);
    console.log(`   (查询IP方法：按Win+R输入cmd，输入ipconfig，看IPv4地址)\n`);
});