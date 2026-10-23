import { defineConfig } from 'vite';
import { scrapeLiveGovScheme } from './scripts/live_scraper.js';
import { getAllUsersFromDB, saveOrUpdateUserInDB, deleteUserFromDB, seedInitialUsersDB } from './scripts/user_db.js';
import { getAllSchemes, saveOrUpdateScheme, deleteSchemeFromDB, getAllOfficialNotifications, saveOfficialNotification } from './scripts/schemes_db.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seed demo users if database is empty
try {
  seedInitialUsersDB();
} catch (_) {}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html')
      }
    }
  },
  plugins: [
    {
      name: 'live-gov-scheme-and-user-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const parsedUrl = new URL(req.url, 'http://localhost');

          // 1. Live Scheme Scraping API
          if (parsedUrl.pathname === '/api/live-scheme') {
            try {
              const targetUrl = parsedUrl.searchParams.get('url');
              const schemeName = parsedUrl.searchParams.get('name') || '';
              const refresh = parsedUrl.searchParams.get('refresh') === 'true';

              if (!targetUrl) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'URL parameter is required.' }));
                return;
              }

              const liveData = await scrapeLiveGovScheme(targetUrl, schemeName, refresh);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(liveData));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }

          // 2. User Database API - Get All Users
          if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
            try {
              const users = getAllUsersFromDB();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: users.length, users }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }

          // 3. User Database API - Sync / Save User Record & Eligible Schemes
          if (parsedUrl.pathname === '/api/users/sync' && (req.method === 'POST' || req.method === 'PUT')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const userData = JSON.parse(body || '{}');
                const savedUser = saveOrUpdateUserInDB(userData);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, user: savedUser }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          // 4. User Database API - Delete User Record
          if (parsedUrl.pathname === '/api/users/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { email, id } = JSON.parse(body || '{}');
                const ok = deleteUserFromDB(email || id);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: ok, message: ok ? 'User deleted' : 'User not found' }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          // 5. Schemes API - Get All Schemes
          if (parsedUrl.pathname === '/api/schemes' && req.method === 'GET') {
            try {
              const schemes = getAllSchemes();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: schemes.length, schemes }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }

          // 6. Schemes API - Create or Update Scheme & Dispatch Official Notification
          if (parsedUrl.pathname === '/api/schemes/save' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { scheme, bulletin } = JSON.parse(body || '{}');
                const result = saveOrUpdateScheme(scheme, bulletin);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          // 7. Schemes API - Delete Scheme
          if (parsedUrl.pathname === '/api/schemes/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { id } = JSON.parse(body || '{}');
                const ok = deleteSchemeFromDB(id);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: ok, message: ok ? 'Scheme deleted' : 'Scheme not found' }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          // 8. Notifications API - Get Official Broadcast Notifications
          if (parsedUrl.pathname === '/api/notifications' && req.method === 'GET') {
            try {
              const notifs = getAllOfficialNotifications();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: notifs.length, notifications: notifs }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }

          // 9. Notifications API - Add Official Notification directly
          if (parsedUrl.pathname === '/api/notifications/add' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const notifData = JSON.parse(body || '{}');
                saveOfficialNotification(notifData);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, notification: notifData }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          next();
        });
      }
    }
  ]
});
