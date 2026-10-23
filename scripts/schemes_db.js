import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllUsersFromDB, writeUsersToDB } from './user_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMES_FILE = path.join(__dirname, '../public/data/schemes.json');
const BACKUP_SCHEMES_FILE = path.join(__dirname, '../data/schemes.json');
const NOTIFS_FILE = path.join(__dirname, '../data/official_notifications.json');

/**
 * Ensure official_notifications.json exists
 */
function ensureNotifsFileExists() {
    const dir = path.dirname(NOTIFS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(NOTIFS_FILE)) {
        fs.writeFileSync(NOTIFS_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Read all schemes from public/data/schemes.json
 */
export function getAllSchemes() {
    try {
        if (fs.existsSync(SCHEMES_FILE)) {
            const raw = fs.readFileSync(SCHEMES_FILE, 'utf-8');
            return JSON.parse(raw) || [];
        } else if (fs.existsSync(BACKUP_SCHEMES_FILE)) {
            const raw = fs.readFileSync(BACKUP_SCHEMES_FILE, 'utf-8');
            return JSON.parse(raw) || [];
        }
        return [];
    } catch (err) {
        console.error('[SchemesDB Error] Reading schemes:', err.message);
        return [];
    }
}

/**
 * Write schemes array back to public/data/schemes.json
 */
export function writeSchemes(schemes) {
    try {
        const dir = path.dirname(SCHEMES_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SCHEMES_FILE, JSON.stringify(schemes, null, 2), 'utf-8');

        // Also write to backup if data/ directory exists
        const backupDir = path.dirname(BACKUP_SCHEMES_FILE);
        if (fs.existsSync(backupDir)) {
            fs.writeFileSync(BACKUP_SCHEMES_FILE, JSON.stringify(schemes, null, 2), 'utf-8');
        }
        return true;
    } catch (err) {
        console.error('[SchemesDB Error] Writing schemes:', err.message);
        return false;
    }
}

/**
 * Read official notifications from data/official_notifications.json
 */
export function getAllOfficialNotifications() {
    ensureNotifsFileExists();
    try {
        const raw = fs.readFileSync(NOTIFS_FILE, 'utf-8');
        return JSON.parse(raw) || [];
    } catch (err) {
        console.error('[SchemesDB Error] Reading notifications:', err.message);
        return [];
    }
}

/**
 * Save an official notification to the official notifications file
 */
export function saveOfficialNotification(notif) {
    ensureNotifsFileExists();
    try {
        const notifs = getAllOfficialNotifications();
        // Insert at beginning (newest first), limit to 100
        notifs.unshift(notif);
        const trimmed = notifs.slice(0, 100);
        fs.writeFileSync(NOTIFS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('[SchemesDB Error] Saving notification:', err.message);
        return false;
    }
}

/**
 * Check if a citizen's profile matches eligibility for a scheme
 */
function isUserEligibleForScheme(userProfile, eligibility) {
    if (!userProfile) return true;
    if (!eligibility) return true;

    if (eligibility.gender && Array.isArray(eligibility.gender) && eligibility.gender.length > 0) {
        if (userProfile.gender && !eligibility.gender.includes(userProfile.gender) && !eligibility.gender.includes('Any')) {
            return false;
        }
    }

    if (eligibility.minAge !== undefined && userProfile.age !== undefined && userProfile.age < eligibility.minAge) {
        return false;
    }
    if (eligibility.maxAge !== undefined && userProfile.age !== undefined && userProfile.age > eligibility.maxAge) {
        return false;
    }

    if (eligibility.occupation && Array.isArray(eligibility.occupation) && eligibility.occupation.length > 0) {
        if (!eligibility.occupation.includes('All') && !eligibility.occupation.includes('Any') && !eligibility.occupation.includes('Other')) {
            const userOcc = userProfile.occupation;
            const secondary = userProfile.nlpResult?.secondaryRoles || [];
            const userRoles = [userOcc, ...secondary].filter(Boolean).map(r => r.toLowerCase());
            const matches = eligibility.occupation.some(occ => 
                userRoles.includes(occ.toLowerCase()) || 
                userRoles.some(ur => ur.includes(occ.toLowerCase()) || occ.toLowerCase().includes(ur))
            );
            if (!matches) return false;
        }
    }

    if (eligibility.maxIncome && userProfile.income && userProfile.income > eligibility.maxIncome) {
        return false;
    }

    if (eligibility.location && eligibility.location !== 'Central' && eligibility.location !== 'All India') {
        if (userProfile.location && userProfile.location !== eligibility.location) {
            return false;
        }
    }

    if (eligibility.caste && Array.isArray(eligibility.caste) && eligibility.caste.length > 0) {
        if (userProfile.caste && !eligibility.caste.includes(userProfile.caste) && !eligibility.caste.includes('Any')) {
            return false;
        }
    }

    if (eligibility.area && Array.isArray(eligibility.area) && eligibility.area.length > 0) {
        if (userProfile.area && !eligibility.area.includes(userProfile.area) && !eligibility.area.includes('Any')) {
            return false;
        }
    }

    if (eligibility.disabledOnly && userProfile.disabled === 'No') {
        return false;
    }

    return true;
}

/**
 * Create or update a scheme manually
 * Dispatches an official institutional notification (without mentioning admin)
 * and updates user eligible schemes in data/users.json
 */
export function saveOrUpdateScheme(schemeData, bulletinData = {}) {
    if (!schemeData || !schemeData.name) {
        throw new Error('Scheme name is required.');
    }

    const schemes = getAllSchemes();
    const existingIndex = schemes.findIndex(s =>
        (schemeData.id && s.id === schemeData.id) ||
        s.name.trim().toLowerCase() === schemeData.name.trim().toLowerCase()
    );

    const isNew = existingIndex === -1;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const timeFormatted = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Generate or preserve ID
    let schemeId = schemeData.id;
    if (!schemeId) {
        schemeId = schemeData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        if (!schemeId) schemeId = 'scheme_' + Date.now();
    }

    // Format benefits as array of strings
    let benefits = [];
    if (Array.isArray(schemeData.benefits)) {
        benefits = schemeData.benefits.filter(Boolean);
    } else if (typeof schemeData.benefits === 'string') {
        benefits = schemeData.benefits.split(/\n|;|\./).map(b => b.trim()).filter(Boolean);
    }
    if (benefits.length === 0) {
        benefits = [schemeData.description || 'Welfare assistance and financial support.'];
    }

    // Format application steps
    let applicationSteps = [];
    if (Array.isArray(schemeData.applicationSteps)) {
        applicationSteps = schemeData.applicationSteps.filter(Boolean);
    } else if (typeof schemeData.applicationSteps === 'string') {
        applicationSteps = schemeData.applicationSteps.split(/\n|;/).map(s => s.trim()).filter(Boolean);
    }
    if (applicationSteps.length === 0) {
        applicationSteps = [
            'Visit the official welfare portal',
            'Verify Aadhaar / demographic eligibility',
            'Submit online registration form'
        ];
    }

    // Format required documents
    let requiredDocuments = [];
    if (Array.isArray(schemeData.requiredDocuments)) {
        requiredDocuments = schemeData.requiredDocuments.filter(Boolean);
    } else if (typeof schemeData.requiredDocuments === 'string') {
        requiredDocuments = schemeData.requiredDocuments.split(/\n|,|;/).map(d => d.trim()).filter(Boolean);
    }
    if (requiredDocuments.length === 0) {
        requiredDocuments = ['Aadhaar Card', 'Bank Passbook / Account Details', 'Passport Size Photograph'];
    }

    // Normalized scheme object
    const finalScheme = {
        id: schemeId,
        name: schemeData.name.trim(),
        category: schemeData.category || 'General Welfare',
        ministry: schemeData.ministry || 'Ministry of Social Justice and Welfare',
        description: schemeData.description || benefits[0] || 'Government Welfare Scheme.',
        benefits: benefits,
        eligibility: {
            minAge: schemeData.eligibility?.minAge !== undefined ? Number(schemeData.eligibility.minAge) : 0,
            maxAge: schemeData.eligibility?.maxAge !== undefined ? Number(schemeData.eligibility.maxAge) : 125,
            location: schemeData.eligibility?.location || 'Central',
            gender: Array.isArray(schemeData.eligibility?.gender) && schemeData.eligibility.gender.length > 0
                ? schemeData.eligibility.gender
                : ['Male', 'Female', 'Other'],
            caste: Array.isArray(schemeData.eligibility?.caste) && schemeData.eligibility.caste.length > 0
                ? schemeData.eligibility.caste
                : ['General', 'OBC', 'SC', 'ST'],
            area: Array.isArray(schemeData.eligibility?.area) && schemeData.eligibility.area.length > 0
                ? schemeData.eligibility.area
                : ['Rural', 'Urban'],
            occupation: Array.isArray(schemeData.eligibility?.occupation) && schemeData.eligibility.occupation.length > 0
                ? schemeData.eligibility.occupation
                : ['All'],
            maxIncome: schemeData.eligibility?.maxIncome ? Number(schemeData.eligibility.maxIncome) : undefined,
            disabledOnly: Boolean(schemeData.eligibility?.disabledOnly)
        },
        applicationSteps: applicationSteps,
        officialLink: schemeData.officialLink || 'https://www.myscheme.gov.in/',
        applicationMode: schemeData.applicationMode || 'Both',
        requiredDocuments: requiredDocuments,
        deadline: schemeData.deadline || 'Active / Open Enrollment',
        lastUpdated: dateFormatted
    };

    // Save scheme in array
    if (isNew) {
        schemes.unshift(finalScheme);
    } else {
        schemes[existingIndex] = { ...schemes[existingIndex], ...finalScheme };
    }

    writeSchemes(schemes);

    // ============================================================
    // INSTITUTIONAL NOTIFICATION GENERATION
    // STRICT RULE: Never say "admin has changed it".
    // Phrase as official ministry gazette / welfare update bulletin.
    // ============================================================
    const customSummary = bulletinData.summary || bulletinData.noticeBody || '';
    const notifType = bulletinData.type || (isNew ? 'announcement' : 'benefit_update');
    
    let notifTitle = bulletinData.title;
    if (!notifTitle) {
        if (isNew) {
            notifTitle = `📢 Official Gazette: Launch of ${finalScheme.name}`;
        } else {
            notifTitle = `📋 Official Scheme Revision: ${finalScheme.name}`;
        }
    }

    let notifBody = '';
    if (customSummary) {
        notifBody = `Official Welfare Gazette (${dateFormatted}): ${customSummary} Eligible citizens are advised to review the revised guidelines and apply on the official portal.`;
    } else if (isNew) {
        notifBody = `Government Notification (${dateFormatted}): '${finalScheme.name}' has been officially launched under ${finalScheme.ministry}. Key Benefits: ${benefits.slice(0, 2).join('; ')}. Applications are now open on the official national portal.`;
    } else {
        notifBody = `Official Revision Bulletin dated ${dateFormatted}: The operational provisions and criteria for '${finalScheme.name}' have been updated. Primary benefits: ${benefits.slice(0, 2).join('; ')}. Beneficiaries may verify eligibility on the national portal.`;
    }

    const officialNotification = {
        id: 'notif_gov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: notifType,
        schemeId: finalScheme.id,
        schemeName: finalScheme.name,
        schemeCategory: finalScheme.category,
        officialLink: finalScheme.officialLink,
        title: notifTitle,
        body: notifBody,
        timestamp: timeFormatted,
        isOfficialBulletin: true,
        read: false
    };

    // Save to server-wide official notifications file
    saveOfficialNotification(officialNotification);

    // ============================================================
    // UPDATE CITIZEN DATABASE (data/users.json)
    // Synchronize eligible schemes & add notification to matching citizens
    // ============================================================
    let affectedUsersCount = 0;
    try {
        const users = getAllUsersFromDB();
        users.forEach(u => {
            const p = u.profile;
            const eligible = isUserEligibleForScheme(p, finalScheme.eligibility);

            if (!u.eligibleSchemes) u.eligibleSchemes = [];
            const sIndex = u.eligibleSchemes.findIndex(s => s.id === finalScheme.id || s.name.toLowerCase() === finalScheme.name.toLowerCase());

            if (eligible) {
                const schemeSummary = {
                    id: finalScheme.id,
                    name: finalScheme.name,
                    category: finalScheme.category,
                    officialLink: finalScheme.officialLink,
                    applicationMode: finalScheme.applicationMode
                };

                if (sIndex !== -1) {
                    u.eligibleSchemes[sIndex] = schemeSummary;
                } else {
                    u.eligibleSchemes.push(schemeSummary);
                }
                u.eligibleSchemesCount = u.eligibleSchemes.length;
                affectedUsersCount++;
            } else if (sIndex !== -1 && !isNew) {
                // If criteria changed and user is no longer eligible, update
                u.eligibleSchemes.splice(sIndex, 1);
                u.eligibleSchemesCount = u.eligibleSchemes.length;
            }

            // Also maintain user-level notification history if field exists
            if (!u.notifications) u.notifications = [];
            u.notifications.unshift(officialNotification);
            if (u.notifications.length > 50) u.notifications = u.notifications.slice(0, 50);
            u.updatedAt = timeFormatted;
        });

        writeUsersToDB(users);
    } catch (err) {
        console.warn('[SchemesDB] User update sync notice:', err.message);
    }

    return {
        success: true,
        isNew,
        scheme: finalScheme,
        notification: officialNotification,
        affectedUsersCount
    };
}

/**
 * Delete a scheme by ID
 */
export function deleteSchemeFromDB(schemeId) {
    if (!schemeId) return false;
    const schemes = getAllSchemes();
    const filtered = schemes.filter(s => s.id !== schemeId);
    if (filtered.length !== schemes.length) {
        writeSchemes(filtered);
        return true;
    }
    return false;
}
