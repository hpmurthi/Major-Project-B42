/**
 * GovNavigator AI - Citizen Authentication & Account Management
 */

const ACCOUNTS_KEY = 'gov_nav_accounts';
const SESSION_KEY = 'gov_nav_session';

/**
 * Hash password securely using SHA-256
 */
async function hashPassword(password) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for non-subtle contexts
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
}

/**
 * Retrieve all registered accounts from local storage
 */
export function getAllAccounts() {
    try {
        const data = localStorage.getItem(ACCOUNTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (_) {
        return [];
    }
}

/**
 * Retrieve current active user session
 */
export function getCurrentUser() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        const parsed = JSON.parse(session);
        // Cross-reference with accounts to get latest profile
        const accounts = getAllAccounts();
        const account = accounts.find(a => a.id === parsed.id || a.email.toLowerCase() === parsed.email.toLowerCase());
        if (account) {
            return {
                id: account.id,
                name: account.name,
                email: account.email,
                createdAt: account.createdAt,
                profile: account.profile || null
            };
        }
        return parsed;
    } catch (_) {
        return null;
    }
}

/**
 * Validate password against standard security criteria:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&* etc.)
 */
export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            minLength: false,
            hasUpper: false,
            hasLower: false,
            hasNumber: false,
            hasSpecial: false,
            message: 'Password is required.'
        };
    }

    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\\-]/.test(password);

    const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

    const missing = [];
    if (!minLength) missing.push('at least 8 characters');
    if (!hasUpper) missing.push('one uppercase letter (A-Z)');
    if (!hasLower) missing.push('one lowercase letter (a-z)');
    if (!hasNumber) missing.push('one number (0-9)');
    if (!hasSpecial) missing.push('one special character (!@#$%^&* etc.)');

    return {
        isValid,
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
        message: isValid ? '' : `Password does not meet standard criteria. Missing: ${missing.join(', ')}.`
    };
}

/**
 * Register a new citizen account
 */
export async function registerUser({ name, email, password, initialProfile = null }) {
    if (!name || !name.trim()) {
        throw new Error('Please enter your full name.');
    }
    if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
    }
    
    // Strict password policy enforcement
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.isValid) {
        throw new Error(pwdCheck.message);
    }

    const accounts = getAllAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
        throw new Error('An account with this email address already exists. Please log in.');
    }

    const passwordHash = await hashPassword(password);
    const newAccount = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        createdAt: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        profile: initialProfile
    };

    accounts.push(newAccount);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    // Automatically log in
    const sessionData = {
        id: newAccount.id,
        name: newAccount.name,
        email: newAccount.email,
        createdAt: newAccount.createdAt,
        token: 'token_' + Math.random().toString(36).substring(2)
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

    // Sync active scheme profile
    if (initialProfile) {
        localStorage.setItem('gov_nav_profile', JSON.stringify(initialProfile));
    }

    return newAccount;
}

/**
 * Authenticate and log in an existing user
 */
export async function loginUser({ email, password }) {
    if (!email || !password) {
        throw new Error('Please provide both email and password.');
    }

    const accounts = getAllAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) {
        throw new Error('No account found with this email. Please check your credentials or Sign Up.');
    }

    const inputHash = await hashPassword(password);
    if (account.passwordHash !== inputHash) {
        throw new Error('Incorrect password. Please try again.');
    }

    const sessionData = {
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt,
        token: 'token_' + Math.random().toString(36).substring(2)
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

    // Load account's saved profile if available
    if (account.profile) {
        localStorage.setItem('gov_nav_profile', JSON.stringify(account.profile));
    } else {
        localStorage.removeItem('gov_nav_profile');
    }

    return account;
}

/**
 * Log out active session
 */
export function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('gov_nav_profile');
}

/**
 * Save / Update user's scheme demographic profile and eligible schemes under their account
 */
export function saveProfileToAccount(profile, eligibleSchemes = []) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const accounts = getAllAccounts();
    const index = accounts.findIndex(a => a.id === currentUser.id || a.email.toLowerCase() === currentUser.email.toLowerCase());
    if (index !== -1) {
        accounts[index].profile = profile;
        accounts[index].eligibleSchemes = eligibleSchemes.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            officialLink: s.officialLink,
            applicationMode: s.applicationMode
        }));
        accounts[index].eligibleSchemesCount = eligibleSchemes.length;
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    // Sync to server-side JSON database (data/users.json)
    syncUserToServer(currentUser, profile, eligibleSchemes);
}

/**
 * Sync user profile and eligible schemes to the server JSON database (data/users.json)
 */
export async function syncUserToServer(user, profile = null, eligibleSchemes = []) {
    if (!user || !user.email) return;
    try {
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            profile: profile || user.profile || null,
            eligibleSchemes: (eligibleSchemes || []).map(s => ({
                id: s.id,
                name: s.name,
                category: s.category,
                officialLink: s.officialLink,
                applicationMode: s.applicationMode
            }))
        };

        const res = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data.user;
    } catch (err) {
        console.warn('[UserSync] Server sync:', err.message);
    }
}


/**
 * Seed initial quick test demo accounts if no accounts exist
 */
export async function seedDemoAccounts() {
    const accounts = getAllAccounts();
    if (accounts.length > 0) return;

    const demoFarmer = {
        id: 'user_demo_farmer',
        name: 'Ramesh Patel',
        email: 'farmer@demo.gov',
        passwordHash: await hashPassword('Farmer@2026#'),
        createdAt: '15 Oct 2026',
        profile: {
            gender: 'Male',
            age: 42,
            occupation: 'Farmer',
            income: 180000,
            location: 'Gujarat',
            district: 'Anand',
            disabled: 'No',
            caste: 'OBC',
            area: 'Rural'
        }
    };

    const demoStudent = {
        id: 'user_demo_student',
        name: 'Pooja Verma',
        email: 'student@demo.gov',
        passwordHash: await hashPassword('Student@2026#'),
        createdAt: '15 Oct 2026',
        profile: {
            gender: 'Female',
            age: 20,
            occupation: 'Student',
            income: 120000,
            location: 'Uttar Pradesh',
            district: 'Lucknow',
            disabled: 'No',
            caste: 'SC',
            area: 'Urban'
        }
    };

    accounts.push(demoFarmer, demoStudent);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
