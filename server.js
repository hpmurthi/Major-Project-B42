import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeLiveGovScheme } from './scripts/live_scraper.js';
import { getAllUsersFromDB, saveOrUpdateUserInDB, deleteUserFromDB, seedInitialUsersDB } from './scripts/user_db.js';
import { getAllSchemes, saveOrUpdateScheme, deleteSchemeFromDB, getAllOfficialNotifications, saveOfficialNotification } from './scripts/schemes_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

// Seed demo users if database is empty
try {
    seedInitialUsersDB();
} catch (_) {}

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);

    // 1. API endpoint for live scheme scraping
    if (reqUrl.pathname === '/api/live-scheme') {
        const targetUrl = reqUrl.searchParams.get('url');
        const schemeName = reqUrl.searchParams.get('name') || '';
        const refresh = reqUrl.searchParams.get('refresh') === 'true';

        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Query parameter "url" is required.' }));
            return;
        }

        try {
            const data = await scrapeLiveGovScheme(targetUrl, schemeName, refresh);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // 2. API endpoint - Get All Users from Database
    if (reqUrl.pathname === '/api/users' && req.method === 'GET') {
        try {
            const users = getAllUsersFromDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: users.length, users }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // 3. API endpoint - Sync / Save User Record & Eligible Schemes
    if (reqUrl.pathname === '/api/users/sync' && (req.method === 'POST' || req.method === 'PUT')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const userData = JSON.parse(body || '{}');
                const savedUser = saveOrUpdateUserInDB(userData);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: savedUser }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 4. API endpoint - Delete User Record
    if (reqUrl.pathname === '/api/users/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { email, id } = JSON.parse(body || '{}');
                const ok = deleteUserFromDB(email || id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: ok, message: ok ? 'User deleted' : 'User not found' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 5. API endpoint - Get All Schemes
    if (reqUrl.pathname === '/api/schemes' && req.method === 'GET') {
        try {
            const schemes = getAllSchemes();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: schemes.length, schemes }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // 6. API endpoint - Save or Update Scheme & Dispatch Notification
    if (reqUrl.pathname === '/api/schemes/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { scheme, bulletin } = JSON.parse(body || '{}');
                const result = saveOrUpdateScheme(scheme, bulletin);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, ...result }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 7. API endpoint - Delete Scheme
    if (reqUrl.pathname === '/api/schemes/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { id } = JSON.parse(body || '{}');
                const ok = deleteSchemeFromDB(id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: ok, message: ok ? 'Scheme deleted' : 'Scheme not found' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // 8. API endpoint - Get Official Notifications
    if (reqUrl.pathname === '/api/notifications' && req.method === 'GET') {
        try {
            const notifs = getAllOfficialNotifications();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: notifs.length, notifications: notifs }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // 9. API endpoint - Add Official Notification
    if (reqUrl.pathname === '/api/notifications/add' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const notifData = JSON.parse(body || '{}');
                saveOfficialNotification(notifData);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, notification: notifData }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Static file serving from dist/
    let filePath = path.join(DIST_DIR, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🌐 GovNavigator AI Live Server running at: http://localhost:${PORT}`);
    console.log(`📡 Live Scraper API available at: http://localhost:${PORT}/api/live-scheme?url=<official_link>`);
    console.log(`👥 Citizen Database API available at: http://localhost:${PORT}/api/users`);
});
