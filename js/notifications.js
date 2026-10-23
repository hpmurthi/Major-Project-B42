/**
 * GovNavigator AI - Scheme Notification & Alert System
 * Polls official government links from a user's saved eligible schemes
 * and fires notifications when changes / announcements are detected.
 */

const NOTIF_STORE_KEY = 'gov_nav_notifications';
const SEEN_HASHES_KEY = 'gov_nav_seen_hashes';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // Poll every 5 minutes

/** Retrieve all stored notifications */
export function getStoredNotifications() {
    try {
        return JSON.parse(localStorage.getItem(NOTIF_STORE_KEY) || '[]');
    } catch (_) {
        return [];
    }
}

/** Save notifications array to localStorage */
function saveNotifications(arr) {
    localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(arr.slice(0, 50))); // cap at 50
}

/** Get set of seen announcement hashes (to avoid duplicates) */
function getSeenHashes() {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_HASHES_KEY) || '[]'));
    } catch (_) {
        return new Set();
    }
}

/** Save seen hashes set */
function saveSeenHashes(set) {
    localStorage.setItem(SEEN_HASHES_KEY, JSON.stringify([...set].slice(0, 200)));
}

/** Simple string hash for deduplication */
function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString(36);
}

/** Mark all notifications as read */
export function markAllRead() {
    const notifs = getStoredNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(notifs);
}

/** Mark a single notification as read */
export function markOneRead(id) {
    const notifs = getStoredNotifications().map(n =>
        n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(notifs);
}

/** Clear all notifications */
export function clearAllNotifications() {
    localStorage.removeItem(NOTIF_STORE_KEY);
    localStorage.removeItem(SEEN_HASHES_KEY);
}

/** Count unread notifications */
export function getUnreadCount() {
    return getStoredNotifications().filter(n => !n.read).length;
}

/**
 * Poll a single scheme's official link for updates.
 * Returns array of new notification objects (empty if nothing new).
 */
async function pollSchemeForUpdates(scheme) {
    if (!scheme || !scheme.officialLink) return [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(
            `/api/live-scheme?url=${encodeURIComponent(scheme.officialLink)}&name=${encodeURIComponent(scheme.name)}&refresh=true`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.success || !data.isLive) return [];

        const seenHashes = getSeenHashes();
        const newNotifs = [];

        // Check announcements from the official page
        const announcements = data.announcements || [];
        announcements.forEach(ann => {
            const h = hashString(scheme.id + ':ann:' + ann);
            if (!seenHashes.has(h)) {
                seenHashes.add(h);
                newNotifs.push({
                    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    type: 'announcement',
                    schemeId: scheme.id,
                    schemeName: scheme.name,
                    schemeCategory: scheme.category || '',
                    officialLink: scheme.officialLink,
                    title: '📢 New Announcement: ' + scheme.name,
                    body: ann,
                    timestamp: new Date().toLocaleString('en-IN'),
                    read: false
                });
            }
        });

        // Check portal is newly reachable (once every 30 min window per scheme)
        const windowKey = hashString(
            scheme.id + ':status:' + data.httpStatus + ':' +
            Math.floor(Date.now() / (30 * 60 * 1000))
        );
        if (!seenHashes.has(windowKey)) {
            seenHashes.add(windowKey);
            newNotifs.push({
                id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                type: 'portal_live',
                schemeId: scheme.id,
                schemeName: scheme.name,
                schemeCategory: scheme.category || '',
                officialLink: scheme.officialLink,
                title: '🌐 Portal Status Update: ' + scheme.name,
                body: `Official portal is live & reachable (HTTP ${data.httpStatus}, ${data.latencyMs}ms response). Checked at ${data.fetchedAt}.`,
                timestamp: new Date().toLocaleString('en-IN'),
                read: false
            });
        }

        // Check live benefit updates from the page
        const benefits = data.liveBenefits || [];
        benefits.slice(0, 1).forEach(ben => {
            const h = hashString(scheme.id + ':ben:' + ben.slice(0, 60));
            if (!seenHashes.has(h)) {
                seenHashes.add(h);
                newNotifs.push({
                    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    type: 'benefit_update',
                    schemeId: scheme.id,
                    schemeName: scheme.name,
                    schemeCategory: scheme.category || '',
                    officialLink: scheme.officialLink,
                    title: '💰 Benefit Update Found: ' + scheme.name,
                    body: ben,
                    timestamp: new Date().toLocaleString('en-IN'),
                    read: false
                });
            }
        });

        saveSeenHashes(seenHashes);
        return newNotifs;
    } catch (err) {
        console.warn('[Notifications] Poll failed for ' + scheme.name + ':', err.message);
        return [];
    }
}

/**
 * Run a full notification check across all of a user's saved eligible schemes.
 * @param {Array} eligibleSchemes - Array of scheme objects
 * @param {Function} onNewNotifications - Callback(newNotifs[]) fired when new ones arrive
 */
export async function checkSchemeNotifications(eligibleSchemes, onNewNotifications) {
    if (!Array.isArray(eligibleSchemes) || eligibleSchemes.length === 0) return [];

    const allNew = [];
    // Sequential checks (cap at 6 to avoid server overload)
    for (const scheme of eligibleSchemes.slice(0, 6)) {
        const newNotifs = await pollSchemeForUpdates(scheme);
        allNew.push(...newNotifs);
        if (newNotifs.length > 0) {
            await new Promise(r => setTimeout(r, 400));
        }
    }

    if (allNew.length > 0) {
        const existing = getStoredNotifications();
        saveNotifications([...allNew, ...existing]);
        if (typeof onNewNotifications === 'function') {
            onNewNotifications(allNew);
        }
    }

    return allNew;
}

/**
 * Synchronize official government bulletins & revisions dispatched from
 * the official administrative portal (e.g. human resource entry when cheerio fails).
 * Formats notifications as institutional notices without stating admin changed it.
 */
export async function syncOfficialBulletins(onNewNotifications) {
    try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return [];
        const data = await res.json();
        const serverNotifs = data.notifications || [];
        if (!Array.isArray(serverNotifs) || serverNotifs.length === 0) return [];

        const currentNotifs = getStoredNotifications();
        const currentIds = new Set(currentNotifs.map(n => n.id));
        const newNotifs = [];

        serverNotifs.forEach(sn => {
            if (!currentIds.has(sn.id)) {
                newNotifs.push({
                    ...sn,
                    read: false
                });
            }
        });

        if (newNotifs.length > 0) {
            const merged = [...newNotifs, ...currentNotifs];
            saveNotifications(merged);
            if (typeof onNewNotifications === 'function') {
                onNewNotifications(newNotifs);
            }
        }

        return newNotifs;
    } catch (err) {
        console.warn('[Notifications] Official bulletin sync error:', err.message);
        return [];
    }
}

/**
 * Start the background polling loop.
 * @param {Function} getSchemes - function() that returns current list of eligible scheme objects
 * @param {Function} onNewNotifications - callback(newNotifs[]) fired when new notifications arrive
 * @returns {Function} cleanup function to stop polling
 */
export function startNotificationPolling(getSchemes, onNewNotifications) {
    const run = async () => {
        // 1. Sync official administrative/gazette bulletins
        await syncOfficialBulletins(onNewNotifications);

        // 2. Poll live scheme portals
        const schemes = getSchemes();
        if (schemes && schemes.length > 0) {
            await checkSchemeNotifications(schemes, onNewNotifications);
        }
    };

    // First run early for immediate bulletin sync
    const initialTimer = setTimeout(run, 1500);
    const intervalId = setInterval(run, POLL_INTERVAL_MS);

    return () => {
        clearTimeout(initialTimer);
        clearInterval(intervalId);
    };
}
