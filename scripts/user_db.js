import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/users.json');

/**
 * Ensure data directory and users.json exist
 */
function ensureDBExists() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Read all users from the JSON database
 */
export function getAllUsersFromDB() {
    ensureDBExists();
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw) || [];
    } catch (err) {
        console.error('[UserDB Error] Reading database:', err.message);
        return [];
    }
}

/**
 * Write updated users list to the JSON database
 */
export function writeUsersToDB(users) {
    ensureDBExists();
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (err) {
        console.error('[UserDB Error] Writing database:', err.message);
        return false;
    }
}

/**
 * Save or update a citizen in the database with their profile and eligible schemes
 */
export function saveOrUpdateUserInDB(userData) {
    if (!userData || !userData.email) {
        throw new Error('Valid user with email is required.');
    }

    const users = getAllUsersFromDB();
    const emailNorm = userData.email.trim().toLowerCase();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === emailNorm || (userData.id && u.id === userData.id));

    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const userRecord = {
        id: userData.id || (existingIndex !== -1 ? users[existingIndex].id : 'usr_' + Date.now()),
        name: userData.name || (existingIndex !== -1 ? users[existingIndex].name : 'Citizen'),
        email: emailNorm,
        createdAt: existingIndex !== -1 ? users[existingIndex].createdAt : nowStr,
        lastLogin: nowStr,
        profile: userData.profile || (existingIndex !== -1 ? users[existingIndex].profile : null),
        eligibleSchemes: userData.eligibleSchemes || (existingIndex !== -1 ? users[existingIndex].eligibleSchemes : []),
        eligibleSchemesCount: (userData.eligibleSchemes ? userData.eligibleSchemes.length : (existingIndex !== -1 ? users[existingIndex].eligibleSchemesCount : 0)) || 0,
        updatedAt: nowStr
    };

    if (existingIndex !== -1) {
        users[existingIndex] = { ...users[existingIndex], ...userRecord };
    } else {
        users.push(userRecord);
    }

    writeUsersToDB(users);
    console.log(`[UserDB] Saved citizen record for: ${userRecord.name} (${userRecord.email}) with ${userRecord.eligibleSchemesCount} eligible schemes.`);
    return userRecord;
}

/**
 * Delete a user from the database by email or ID
 */
export function deleteUserFromDB(emailOrId) {
    if (!emailOrId) return false;
    const users = getAllUsersFromDB();
    const query = emailOrId.trim().toLowerCase();
    const filtered = users.filter(u => u.email.toLowerCase() !== query && u.id !== emailOrId);
    if (filtered.length !== users.length) {
        writeUsersToDB(filtered);
        console.log(`[UserDB] Deleted user record: ${emailOrId}`);
        return true;
    }
    return false;
}

/**
 * Seed initial demo accounts if database is empty
 */
export function seedInitialUsersDB(schemesList = []) {
    ensureDBExists();
    const users = getAllUsersFromDB();
    if (users.length > 0) return;

    console.log('[UserDB] Initializing citizen database with demo profiles...');

    const rameshProfile = {
        gender: 'Male',
        age: 42,
        occupation: 'Farmer',
        income: 180000,
        location: 'Gujarat',
        district: 'Anand',
        disabled: 'No',
        caste: 'OBC',
        area: 'Rural'
    };

    const poojaProfile = {
        gender: 'Female',
        age: 20,
        occupation: 'Student',
        income: 120000,
        location: 'Uttar Pradesh',
        district: 'Lucknow',
        disabled: 'No',
        caste: 'SC',
        area: 'Urban'
    };

    const filterEligible = (profile) => {
        if (!schemesList || schemesList.length === 0) return [];
        return schemesList.filter(s => {
            const e = s.eligibility;
            if (e.gender && !e.gender.includes(profile.gender)) return false;
            if (e.minAge !== undefined && profile.age < e.minAge) return false;
            if (e.maxAge !== undefined && profile.age > e.maxAge) return false;
            if (e.occupation && !e.occupation.includes(profile.occupation)) return false;
            if (e.maxIncome && profile.income > e.maxIncome) return false;
            if (e.location && e.location !== 'Central' && e.location !== profile.location) return false;
            if (e.caste && !e.caste.includes(profile.caste)) return false;
            if (e.area && !e.area.includes(profile.area)) return false;
            if (e.disabledOnly && profile.disabled === 'No') return false;
            return true;
        }).map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            officialLink: s.officialLink,
            applicationMode: s.applicationMode
        }));
    };

    const rameshSchemes = filterEligible(rameshProfile);
    const poojaSchemes = filterEligible(poojaProfile);

    const initialUsers = [
        {
            id: 'user_demo_farmer',
            name: 'Ramesh Patel',
            email: 'farmer@demo.gov',
            createdAt: '16 Oct 2026, 06:00 AM',
            lastLogin: '16 Oct 2026, 06:15 AM',
            profile: rameshProfile,
            eligibleSchemes: rameshSchemes,
            eligibleSchemesCount: rameshSchemes.length,
            updatedAt: '16 Oct 2026, 06:15 AM'
        },
        {
            id: 'user_demo_student',
            name: 'Pooja Verma',
            email: 'student@demo.gov',
            createdAt: '16 Oct 2026, 06:00 AM',
            lastLogin: '16 Oct 2026, 06:15 AM',
            profile: poojaProfile,
            eligibleSchemes: poojaSchemes,
            eligibleSchemesCount: poojaSchemes.length,
            updatedAt: '16 Oct 2026, 06:15 AM'
        }
    ];

    writeUsersToDB(initialUsers);
    console.log(`[UserDB] Seeded ${initialUsers.length} citizen records successfully.`);
}
