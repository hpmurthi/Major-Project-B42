import { Chatbot } from './js/chatbot.js';
import { matchSchemes, searchByKeyword } from './js/engine.js';
import { t, setLang, currentLang } from './js/i18n.js';
import { 
    getCurrentUser, 
    loginUser, 
    registerUser, 
    logoutUser, 
    saveProfileToAccount, 
    seedDemoAccounts,
    validatePassword
} from './js/auth.js';
import {
    getStoredNotifications,
    markAllRead,
    markOneRead,
    clearAllNotifications,
    getUnreadCount,
    startNotificationPolling,
    checkSchemeNotifications,
    syncOfficialBulletins
} from './js/notifications.js';

seedDemoAccounts();

let schemes = [];
fetch('/data/schemes.json')
    .then(r => r.json())
    .then(data => {
        schemes = data;
        console.log(`Successfully loaded ${schemes.length} schemes into the system.`);
        if (userProfile) {
            handleComplete(userProfile);
        }
    })
    .catch(console.error);
// DOM Elements
const chatHistory = document.getElementById('chat-history');
const interactionArea = document.getElementById('interaction-area');
const chatView = document.getElementById('chat-view');
const dashboardView = document.getElementById('dashboard-view');
const profileView = document.getElementById('profile-view');
const resultsArea = document.getElementById('results');
const viewTitle = document.getElementById('view-title');
const userBadge = document.getElementById('user-badge');
const schemesCount = document.getElementById('schemes-count');
const summaryContent = document.getElementById('summary-content');
const profileDetailsFull = document.getElementById('profile-details-full');
const smartSearch = document.getElementById('smart-search');
const exportBtn = document.getElementById('export-report');
const whatsappShareBtn = document.getElementById('whatsapp-share');
const resetBtn = document.getElementById('reset-profile');

// Auth DOM Elements
const authBtn = document.getElementById('auth-btn');
const navAuthToggle = document.getElementById('nav-auth-toggle');
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');
const profileAccountCard = document.getElementById('profile-account-card');
const profileAuthAction = document.getElementById('profile-auth-action');
const demoFarmerBtn = document.getElementById('demo-farmer-btn');
const demoStudentBtn = document.getElementById('demo-student-btn');

// Modal Elements
const schemeModal = document.getElementById('scheme-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

// Notification DOM Elements
const notifBellBtn          = document.getElementById('notif-bell-btn');
const notifBadge            = document.getElementById('notif-badge');
const navNotifBtn           = document.getElementById('nav-notifications');
const navNotifBadge         = document.getElementById('nav-notif-badge');
const notifPanel            = document.getElementById('notif-panel');
const notifPanelOverlay     = document.getElementById('notif-panel-overlay');
const notifPanelClose       = document.getElementById('notif-panel-close');
const notifPanelBody        = document.getElementById('notif-panel-body');
const notifPanelCount       = document.getElementById('notif-panel-count');
const notifMarkAllBtn       = document.getElementById('notif-mark-all-btn');
const notifClearBtn         = document.getElementById('notif-clear-btn');
const notifPollingStatus    = document.getElementById('notif-polling-status');
const toastContainer        = document.getElementById('toast-container');
const notifOpenFullBtn      = document.getElementById('notif-open-full-btn');

// Notifications Page & Detail Modal Elements
const notificationsView     = document.getElementById('notifications-view');
const notifPageList         = document.getElementById('notif-page-list');
const notifPageRefresh      = document.getElementById('notif-page-refresh');
const notifPageMarkRead     = document.getElementById('notif-page-mark-read');
const notifPageClear        = document.getElementById('notif-page-clear');
const notifPageStatusText   = document.getElementById('notif-page-status-text');
const notifDetailModal      = document.getElementById('notif-detail-modal');
const closeNotifDetailModal = document.getElementById('close-notif-detail-modal');
const notifDetailBody       = document.getElementById('notif-detail-body');

let currentMatches = [];
let userProfile = JSON.parse(localStorage.getItem('gov_nav_profile')) || null;
// Force clear old legacy profiles that used 'occupation' or didn't have 'district'
if (userProfile && (!userProfile.age || userProfile.district === undefined)) {
    userProfile = null;
    localStorage.removeItem('gov_nav_profile');
}

const navDiscovery = document.getElementById('nav-discovery');
const navDashboard = document.getElementById('nav-dashboard');
const navProfile = document.getElementById('nav-profile');
const langSelect = document.getElementById('lang-select');

if (langSelect) {
    langSelect.onchange = (e) => {
        setLang(e.target.value);
        document.title = t('title');
        navDiscovery.innerText = "💬 " + t('discovery');
        navDashboard.innerText = "📊 " + t('dashboard');
        navProfile.innerText = "👤 " + t('profile');
        if (smartSearch) smartSearch.placeholder = t('search');
        if (confirm("Language changed. Reload to apply full translations?")) location.reload();
    };
}

const appendMessage = (text, sender) => {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.innerText = text;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
};

/**
 * Visual Workflow Pipeline Stepper Tracker
 * Workflow: 1. User Profile -> 2. NLP Processing -> 3. Eligibility Matching -> 4. Recommendations -> 5. Scheme Details -> 6. Application Guidance
 */
const setWorkflowStep = (stepNumber) => {
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`step-${i}`);
        if (!el) continue;
        el.classList.remove('active', 'completed');
        const numEl = el.querySelector('.step-num');
        if (i < stepNumber) {
            el.classList.add('completed');
            if (numEl) numEl.innerText = '✔';
        } else if (i === stepNumber) {
            el.classList.add('active');
            if (numEl) numEl.innerText = String(i);
        } else {
            if (numEl) numEl.innerText = String(i);
        }
    }
};

const switchView = (viewName) => {
    // Hide all
    chatView.classList.replace('view-active', 'view-hidden');
    dashboardView.classList.replace('view-active', 'view-hidden');
    profileView.classList.replace('view-active', 'view-hidden');
    if (notificationsView) notificationsView.classList.replace('view-active', 'view-hidden');
    
    navDiscovery.classList.remove('active');
    navDashboard.classList.remove('active');
    navProfile.classList.remove('active');
    if (navNotifBtn) navNotifBtn.classList.remove('active');

    if (viewName === 'discovery') {
        chatView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "Assistant Discovery";
        navDiscovery.classList.add('active');
        setWorkflowStep(userProfile ? 1 : 1);
        // Restart bot if it has already completed or no interaction is showing
        if (interactionArea && interactionArea.innerHTML.trim() === '') {
            startBotFresh();
        }
    } else if (viewName === 'dashboard') {
        dashboardView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "Government Dashboard";
        navDashboard.classList.add('active');
        setWorkflowStep(userProfile ? 4 : 1);
    } else if (viewName === 'profile') {
        profileView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "My Profile";
        navProfile.classList.add('active');
        setWorkflowStep(userProfile ? 4 : 1);
        renderProfilePage();
    } else if (viewName === 'notifications') {
        if (notificationsView) notificationsView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "Scheme Notifications & Updates";
        if (navNotifBtn) navNotifBtn.classList.add('active');
        renderNotificationsPage();
        closeNotifPanel();
    }
};

navDiscovery.onclick = () => switchView('discovery');
navDashboard.onclick = () => switchView('dashboard');
navProfile.onclick = () => switchView('profile');
if (navNotifBtn) navNotifBtn.onclick = () => switchView('notifications');

const updateAuthUI = () => {
    const user = getCurrentUser();
    if (user) {
        userBadge.innerHTML = `👤 ${user.name.split(' ')[0]}`;
        authBtn.innerText = 'Log Out';
        authBtn.style.background = '#e53e3e';
        if (navAuthToggle) {
            navAuthToggle.innerText = `🚪 Sign Out (${user.name.split(' ')[0]})`;
            navAuthToggle.style.color = '#fc8181';
        }
        if (profileAuthAction) {
            profileAuthAction.innerText = 'Switch Account';
        }
    } else {
        userBadge.innerHTML = `👤 Guest`;
        authBtn.innerText = 'Sign In';
        authBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
        if (navAuthToggle) {
            navAuthToggle.innerText = '🔐 Sign In / Register';
            navAuthToggle.style.color = 'var(--accent)';
        }
        if (profileAuthAction) {
            profileAuthAction.innerText = 'Sign In to Save Profile';
        }
    }
};

const handleLogout = () => {
    logoutUser();
    userProfile = null;
    localStorage.removeItem('gov_nav_profile');
    updateAuthUI();
    location.reload();
};

const renderProfilePage = () => {
    const user = getCurrentUser();
    
    // Render Account Section
    if (user && profileAccountCard) {
        profileAccountCard.innerHTML = `
            <div class="profile-card-header">
                <div class="profile-avatar-circle">${user.name.charAt(0).toUpperCase()}</div>
                <div style="flex: 1; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <h2 style="margin: 0; font-size: 1.4rem;">${user.name}</h2>
                        <span style="background: rgba(72,187,120,0.2); color: #48bb78; border: 1px solid rgba(72,187,120,0.4); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">Verified Citizen</span>
                    </div>
                    <div style="color: #cbd5e0; font-size: 0.9rem; margin-top: 0.25rem;">${user.email}</div>
                    <div style="color: #718096; font-size: 0.8rem; margin-top: 0.25rem;">Account Created: ${user.createdAt || 'Active'}</div>
                </div>
                <button id="profile-logout-btn" class="option-btn" style="background: rgba(229,62,62,0.2); color: #fc8181; border: 1px solid rgba(229,62,62,0.4); padding: 8px 16px; margin: 0;">Sign Out</button>
            </div>
        `;
        const pLogout = document.getElementById('profile-logout-btn');
        if (pLogout) pLogout.onclick = handleLogout;
    } else if (profileAccountCard) {
        profileAccountCard.innerHTML = `
            <div style="background: rgba(255, 153, 51, 0.1); border: 1px solid rgba(255, 153, 51, 0.3); padding: 1.25rem; border-radius: 14px; margin-bottom: 1.5rem; text-align: left; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <strong style="color: var(--accent); display: block; font-size: 1rem;">👤 Browsing as Guest</strong>
                    <p style="margin: 0.25rem 0 0 0; color: #cbd5e0; font-size: 0.85rem;">Sign in or create a citizen account to permanently save your eligibility profile and documents.</p>
                </div>
                <button id="guest-signin-btn" class="auth-header-btn">Sign In / Register</button>
            </div>
        `;
        const guestBtn = document.getElementById('guest-signin-btn');
        if (guestBtn) guestBtn.onclick = () => openAuthModal('login');
    }

    // Render Demographic Profile
    if (!userProfile) {
        profileDetailsFull.innerHTML = `
            <div style="text-align: center; padding: 1.5rem;">
                <p style="color: #a0aec0; margin-bottom: 1rem;">No scheme eligibility profile found.</p>
                <button id="start-discovery-btn" class="option-btn">Start Discovery Questionnaire</button>
            </div>
        `;
        const startBtn = document.getElementById('start-discovery-btn');
        if (startBtn) startBtn.onclick = () => switchView('discovery');
        return;
    }

    const nlp = userProfile.nlpResult;
    const occDisplay = nlp ? nlp.displayName : userProfile.occupation;
    const smallScaleBadge = (nlp && nlp.isSmallScale) 
        ? `<span style="background: rgba(237,137,54,0.2); color: #ed8936; border: 1px solid #ed8936; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; margin-left: 6px; font-weight: 600;">🏷️ Small Scale Merchant</span>` 
        : '';
    const rawNote = (userProfile.occupationRaw && userProfile.occupationRaw !== userProfile.occupation) 
        ? `<div style="font-size: 0.75rem; color: #a0aec0; margin-top: 2px;">Original Input: <em>"${userProfile.occupationRaw}"</em></div>` 
        : '';

    profileDetailsFull.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: left;">
            <div><strong>Gender:</strong></div><div>${userProfile.gender}</div>
            <div><strong>Age:</strong></div><div>${userProfile.age} yrs <span style="font-size:0.75rem; color:#48bb78;">(0-125 range)</span></div>
            <div><strong>Occupation:</strong></div><div>${occDisplay} ${smallScaleBadge} ${rawNote}</div>
            <div><strong>Annual Income:</strong></div><div>₹${Number(userProfile.income).toLocaleString()}</div>
            <div><strong>State/UT:</strong></div><div>${userProfile.location}</div>
            <div><strong>District/City:</strong></div><div>${userProfile.district}</div>
            <div><strong>Area:</strong></div><div>${userProfile.area}</div>
            <div><strong>Category/Caste:</strong></div><div>${userProfile.caste}</div>
            <div><strong>Disabled:</strong></div><div>${userProfile.disabled}</div>
        </div>
    `;

    // Render Saved Schemes in User Database
    const savedCard = document.getElementById('profile-saved-schemes-card');
    const savedSchemes = (user && user.eligibleSchemes && user.eligibleSchemes.length > 0) ? user.eligibleSchemes : currentMatches;

    if (savedCard) {
        if (savedSchemes && savedSchemes.length > 0) {
            savedCard.innerHTML = `
                <div class="stat-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(72,187,120,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                        <h4 style="margin: 0; color: #48bb78; font-size: 1.05rem;">💾 Eligible Schemes Saved in Database (${savedSchemes.length})</h4>
                        <span style="font-size: 0.75rem; color: #48bb78; background: rgba(72,187,120,0.15); border: 1px solid #48bb78; padding: 2px 8px; border-radius: 6px;">Persistent Record</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.6rem; max-height: 260px; overflow-y: auto; padding-right: 0.25rem;">
                        ${savedSchemes.map((s, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.9rem; background: rgba(0,0,0,0.25); border-radius: 8px; border-left: 3px solid var(--accent);">
                                <div>
                                    <strong style="font-size: 0.9rem; color: white;">${idx+1}. ${s.name}</strong>
                                    <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 2px;">
                                        <span style="color: var(--accent);">${s.category}</span> • <span>${s.applicationMode || 'Online'}</span>
                                    </div>
                                </div>
                                <button class="view-details-btn" style="padding: 4px 10px; font-size: 0.75rem;" data-scheme-id="${s.id}">View Details</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            savedCard.querySelectorAll('.view-details-btn').forEach(btn => {
                btn.onclick = () => {
                    const sid = btn.getAttribute('data-scheme-id');
                    const fullScheme = schemes.find(x => x.id === sid);
                    if (fullScheme) openSchemeModal(fullScheme);
                };
            });
        } else {
            savedCard.innerHTML = ``;
        }
    }
};

resetBtn.onclick = () => {
    if (confirm("Are you sure you want to reset your profile? This will clear your current matches.")) {
        localStorage.removeItem('gov_nav_profile');
        location.reload();
    }
};

const handleComplete = (profile) => {
    userProfile = profile;
    localStorage.setItem('gov_nav_profile', JSON.stringify(profile));

    // Workflow Progression: Step 2: NLP Processing
    setWorkflowStep(2);

    setTimeout(() => {
        // Workflow Progression: Step 3: Eligibility & Scheme Matching
        setWorkflowStep(3);
        const matched = matchSchemes(profile, schemes);
        saveProfileToAccount(profile, matched); // Save profile AND eligible schemes to database
        
        // Update Badge & Dashboard Stats
        updateAuthUI();
        schemesCount.innerText = matched.length;

        const nlp = profile.nlpResult;
        const occDisplay = nlp ? nlp.displayName : (profile.occupation || 'Not Specified');
        const smallScaleBadge = (nlp && nlp.isSmallScale) 
            ? `<span style="background: rgba(237,137,54,0.2); color: #ed8936; border: 1px solid #ed8936; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; margin-left: 6px; font-weight: 600;">🏷️ Small Scale Merchant</span>` 
            : '';
        const rawNote = (profile.occupationRaw && profile.occupationRaw !== profile.occupation) 
            ? `<div style="font-size: 0.75rem; color: #a0aec0; margin-top: 2px;">Original Input: <em>"${profile.occupationRaw}"</em></div>` 
            : '';

        summaryContent.innerHTML = `
            <p><strong>Age:</strong> ${profile.age} yrs <span style="font-size:0.75rem; color:#48bb78;">(0-125 range)</span> | <strong>Gender:</strong> ${profile.gender}</p>
            <p><strong>Occupation:</strong> ${occDisplay} ${smallScaleBadge} ${rawNote}</p>
            <p><strong>Location:</strong> ${profile.district}, ${profile.location} (${profile.area})</p>
            <p><strong>Income:</strong> ₹${Number(profile.income).toLocaleString()} / yr</p>
            <p><strong>Category:</strong> ${profile.caste}</p>
        `;

        // Workflow Progression: Step 4: Recommendations
        currentMatches = matched;
        renderMatches(matched);
        setWorkflowStep(4);

        // Auto-switch to Dashboard
        setTimeout(() => switchView('dashboard'), 600);
    }, 400);
};

const getAppModeDetails = (mode) => {
    const m = (mode || 'Online').toLowerCase();
    if (m.includes('both')) return { text: '🔄 Online & Offline', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
    if (m.includes('online')) return { text: '🌐 Online Portal', bg: 'rgba(72, 187, 120, 0.15)', color: '#48bb78' };
    if (m.includes('offline')) return { text: '🏢 Offline Center', bg: 'rgba(237, 137, 54, 0.15)', color: '#ed8936' };
    if (m.includes('csc') || m.includes('center')) return { text: '📍 CSC / Digital Kendra', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
    if (m.includes('bank')) return { text: '🏦 Bank Branch', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
    if (m.includes('panchayat') || m.includes('municipal')) return { text: '🏛 Gram Panchayat / Municipality', bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' };
    if (m.includes('post')) return { text: '📮 Post Office', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' };
    if (m.includes('app')) return { text: '📱 Mobile App', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
    return { text: `📝 ${mode || 'Both'}`, bg: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e0' };
};

const openSchemeModal = (scheme) => {
    // Workflow Progression: Step 5: Scheme Details
    setWorkflowStep(5);

    let hostname = 'Official Portal';
    try { hostname = new URL(scheme.officialLink).hostname; } catch(_) {}

    const appMode = getAppModeDetails(scheme.applicationMode);

    modalBody.innerHTML = `
        <div class="modal-workflow-bar" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 51, 102, 0.4); border: 1px solid rgba(255, 153, 51, 0.4); padding: 8px 14px; border-radius: 10px; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #90cdf4;">
                <span>🔍 Step 5: <strong>Scheme Details & Eligibility Verification</strong></span>
            </div>
            <div id="step-6-status-pill" style="font-size: 0.78rem; color: #a0aec0; background: rgba(255,255,255,0.06); padding: 2px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                Next: 🎯 Step 6 Application Guidance
            </div>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-bottom: 0.6rem;">
            <span class="modal-category" style="margin-bottom: 0;">${scheme.category}</span>
            <span style="font-size: 0.76rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; background: ${appMode.bg}; color: ${appMode.color}; border: 1px solid currentColor;">
                ${appMode.text}
            </span>
        </div>
        <h2>${scheme.name}</h2>
        
        <!-- Live Official Portal Verification Card -->
        <div class="live-portal-banner" id="live-portal-banner">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="live-pulse-dot" id="live-dot"></span>
                    <strong id="live-portal-title">Connecting to Official Portal...</strong>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span id="live-portal-badge" class="live-badge connecting">Verifying Live Link...</span>
                    <button id="live-refresh-btn" class="live-refresh-btn" title="Refresh Live Data">🔄 Refresh</button>
                </div>
            </div>
            <div id="live-portal-details" style="margin-top: 0.75rem; font-size: 0.85rem; color: #cbd5e0;">
                Querying official site <code style="color: #63b3ed; word-break: break-all;">${scheme.officialLink}</code> in real-time...
            </div>
            <div id="live-announcements-container" style="display: none; margin-top: 0.75rem; background: rgba(255, 153, 51, 0.15); border-left: 3px solid var(--accent); padding: 0.6rem 0.8rem; border-radius: 6px;">
                <strong style="color: var(--accent); font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">📢 Latest Live Portal Announcements:</strong>
                <div id="live-announcements-list" style="font-size: 0.85rem; color: #f7fafc;"></div>
            </div>
            <div id="live-extra-container" style="display: none; margin-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.5rem;">
                <div id="live-helplines" style="font-size: 0.8rem; color: #48bb78; margin-top: 0.25rem;"></div>
            </div>
        </div>

        <p style="font-size: 1.1rem; color: #cbd5e0; line-height: 1.6;">${scheme.description}</p>
        
        <div class="detail-section">
            <h4>Key Benefits</h4>
            <ul>${scheme.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>

        <div class="detail-section">
            <h4>Application Steps</h4>
            <ol style="color: #cbd5e0; padding-left: 1.2rem;">
                ${(scheme.applicationSteps || ["Submit application form", "Provide documents"]).map(step => `<li style="margin-bottom: 0.5rem">${step}</li>`).join('')}
            </ol>
            <button id="form-assistant-btn" class="option-btn" style="margin-top: 1rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(72,187,120,0.1); color: #48bb78; border-color: #48bb78; font-size: 0.9rem;">
                🤖 Need help filling the form? Ask the AI Assistant
            </button>
            <div id="form-assistant-chat" style="display: none; margin-top: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; border: 1px solid rgba(72,187,120,0.3);">
                <div id="fa-history" style="max-height: 150px; overflow-y: auto; margin-bottom: 1rem; font-size: 0.85rem; color: #a0aec0; padding-right: 0.5rem;">
                    <div style="margin-bottom: 0.5rem; color: #48bb78;"><strong>🤖 AI:</strong> How can I help you with this application? Having trouble understanding a step?</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="fa-input" style="flex: 1; padding: 0.5rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: white; font-size: 0.85rem;" placeholder="Ask about mapping, documents..." />
                    <button id="fa-send" style="padding: 0.5rem 1rem; background: #48bb78; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 0.85rem;">Send</button>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>📄 Document Checklist & Mock Vault</h4>
            <div id="doc-checklist" style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                ${(scheme.requiredDocuments || ["Aadhaar Card", "Income Certificate", "Passport Photo"]).map((doc, i) => `
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <input type="checkbox" id="doc-${i}" class="doc-checkbox" style="margin-right: 0.5rem; accent-color: #48bb78; transform: scale(1.2);" disabled>
                        <label for="doc-${i}" style="color: #cbd5e0;">${doc}</label>
                    </div>
                `).join('')}
            </div>
            <button id="digilocker-btn" class="option-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #2c5282;">
                🔒 Sync with Mock DigiLocker Vault
            </button>
            <div id="digilocker-status" style="text-align: center; font-size: 0.85rem; margin-top: 0.5rem; color: #48bb78; display: none;">
                ✅ Verified! All documents retrieved successfully.
            </div>
        </div>

        ${(() => {
            const mLower = (scheme.applicationMode || '').toLowerCase();
            const hasPhysicalPresence = mLower.includes('offline') || mLower.includes('both') || mLower.includes('csc') || mLower.includes('bank') || mLower.includes('panchayat') || mLower.includes('post');
            if (hasPhysicalPresence) {
                const stepsStr = (scheme.applicationSteps || []).join(" ").toLowerCase();
                let targetFacility = "Government Office";
                if (mLower.includes('bank') || stepsStr.includes('bank')) targetFacility = "Bank";
                else if (mLower.includes('panchayat') || stepsStr.includes('panchayat')) targetFacility = "Gram Panchayat";
                else if (mLower.includes('csc') || stepsStr.includes('csc')) targetFacility = "Common Service Center CSC";
                else if (mLower.includes('post') || stepsStr.includes('post office')) targetFacility = "Post Office";
                else if (stepsStr.includes('anganwadi')) targetFacility = "Anganwadi Center";
                
                const searchQuery = encodeURIComponent(`Nearest ${targetFacility} in ${userProfile?.district || ''} ${userProfile?.location || ''}`);
                return `
                    <div class="detail-section" id="location-finder" style="display: none; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; animation: fadeIn 0.4s ease-out;">
                        <h4>🗺️ Nearby Assistance Finder (${appMode.text})</h4>
                        <p style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #a0aec0;">Find the nearest <strong>${targetFacility}</strong> to physically apply or submit documents.</p>
                        <div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1rem; position: relative;">
                            <div id="map-loading" style="position: absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#cbd5e0; z-index: 1;">Locating nearby centers...</div>
                            <iframe width="100%" height="100%" style="border:0; position:relative; z-index:2; background: #0A0C12;" loading="lazy" allowfullscreen 
                                src="https://maps.google.com/maps?q=${searchQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed"
                                onload="document.getElementById('map-loading').style.display='none'">
                            </iframe>
                        </div>
                    </div>
                `;
            }
            return '';
        })()}

        <button id="external-link-btn" class="apply-btn" style="background: #4a5568; border: none; font-size: 1rem; width: 100%; text-align: center; cursor: not-allowed; opacity: 0.6; transition: all 0.3s ease;" disabled>
            Verify Documents to Apply
        </button>
    `;
    schemeModal.classList.remove('hidden-modal');

    // Live Official Portal Data Fetcher
    const fetchLiveGovData = async (forceRefresh = false) => {
        const liveTitle = document.getElementById('live-portal-title');
        const liveBadge = document.getElementById('live-portal-badge');
        const liveDetails = document.getElementById('live-portal-details');
        const annContainer = document.getElementById('live-announcements-container');
        const annList = document.getElementById('live-announcements-list');
        const liveExtra = document.getElementById('live-extra-container');
        const liveHelplines = document.getElementById('live-helplines');

        if (!liveTitle) return;

        liveTitle.innerHTML = `Connecting directly to official portal...`;
        liveBadge.className = 'live-badge connecting';
        liveBadge.innerText = 'Verifying...';

        try {
            const res = await fetch(`/api/live-scheme?url=${encodeURIComponent(scheme.officialLink)}&name=${encodeURIComponent(scheme.name)}${forceRefresh ? '&refresh=true' : ''}`);
            const data = await res.json();

            if (data.success && data.isLive) {
                liveTitle.innerHTML = `🌐 Live Verified from Official Portal: <span style="color: #48bb78;">${data.domain}</span>`;
                liveBadge.className = 'live-badge online';
                liveBadge.innerText = `● HTTP ${data.httpStatus} • ${data.latencyMs}ms`;
                
                let detailsMsg = `<strong>Live Status:</strong> Active & Reachable | <strong>Timestamp:</strong> ${data.fetchedAt}`;
                if (data.fromCache) detailsMsg += ` <span style="color: #a0aec0;">(cached)</span>`;
                liveDetails.innerHTML = detailsMsg;

                if (data.announcements && data.announcements.length > 0) {
                    annContainer.style.display = 'block';
                    annList.innerHTML = data.announcements.map(a => `<div style="margin-bottom: 0.25rem;">• ${a}</div>`).join('');
                } else {
                    annContainer.style.display = 'none';
                }

                if (data.helplines && data.helplines.length > 0) {
                    liveExtra.style.display = 'block';
                    liveHelplines.innerHTML = `📞 <strong>Official Helpline Extracted:</strong> ${data.helplines.join(' | ')}`;
                }

                // If live detected documents exist, augment checklist
                if (data.detectedDocuments && data.detectedDocuments.length > 0) {
                    const docChecklist = document.getElementById('doc-checklist');
                    if (docChecklist) {
                        const existingDocs = (scheme.requiredDocuments || []).map(d => d.toLowerCase());
                        const newDocs = data.detectedDocuments.filter(d => !existingDocs.some(ed => ed.includes(d.toLowerCase())));
                        newDocs.forEach((doc, idx) => {
                            const div = document.createElement('div');
                            div.style.cssText = "display: flex; align-items: center; margin-bottom: 0.5rem; color: #48bb78;";
                            div.innerHTML = `
                                <input type="checkbox" id="live-doc-${idx}" class="doc-checkbox" style="margin-right: 0.5rem; accent-color: #48bb78; transform: scale(1.2);" disabled>
                                <label for="live-doc-${idx}">⚡ ${doc} <small style="background: rgba(72,187,120,0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">Live Extracted</small></label>
                            `;
                            docChecklist.appendChild(div);
                        });
                    }
                }
            } else {
                liveTitle.innerHTML = `⚠️ Official Portal Contacted: <span style="color: #f6ad55;">${data.domain || 'Gov Portal'}</span>`;
                liveBadge.className = 'live-badge offline';
                liveBadge.innerText = `Secured / High Traffic`;
                liveDetails.innerHTML = `Official server status: <em>${data.errorMessage || 'Server firewall or maintenance mode.'}</em> Using verified scheme dataset.`;
            }
        } catch (err) {
            liveTitle.innerHTML = `⚠️ Live Portal Notice`;
            liveBadge.className = 'live-badge offline';
            liveBadge.innerText = `Offline`;
            liveDetails.innerHTML = `Could not contact server directly (${err.message}). Displaying local verified records.`;
        }
    };

    fetchLiveGovData(false);

    const liveRefreshBtn = document.getElementById('live-refresh-btn');
    if (liveRefreshBtn) {
        liveRefreshBtn.onclick = () => fetchLiveGovData(true);
    }

    const digilockerBtn = document.getElementById('digilocker-btn');
    const applyBtn = document.getElementById('external-link-btn');
    const locationFinder = document.getElementById('location-finder');

    // Form Assistant Logic
    const faBtn = document.getElementById('form-assistant-btn');
    const faChat = document.getElementById('form-assistant-chat');
    const faHistory = document.getElementById('fa-history');
    const faInput = document.getElementById('fa-input');
    const faSend = document.getElementById('fa-send');

    if (faBtn) {
        faBtn.onclick = () => {
            faBtn.style.display = 'none';
            faChat.style.display = 'block';
            faInput.focus();
            setWorkflowStep(6);
            const s6Pill = document.getElementById('step-6-status-pill');
            if (s6Pill) {
                s6Pill.innerHTML = '🎯 <strong style="color: #48bb78;">Step 6: Application Guidance Active</strong>';
                s6Pill.style.borderColor = '#48bb78';
                s6Pill.style.background = 'rgba(72,187,120,0.15)';
            }
        };

        const generateFAIAnswer = (query) => {
            query = query.toLowerCase();
            if (query.includes('document') || query.includes('certificate')) return "For documents, ensure you bring both original and xerox (photocopy) copies. The officials usually verify the original and take the xerox.";
            if (query.includes('form') || query.includes('fill')) return "Take your time filling out the form. If a section doesn't apply to you, write 'N/A' (Not Applicable). Always use block (capital) black ink letters.";
            if (query.includes('sign') || query.includes('thumb')) return "You can either sign or provide a thumb impression. In rural centers, a left-hand thumb impression is completely acceptable if you cannot sign.";
            if (query.includes('where') || query.includes('map') || query.includes('go')) return "Look at the map below! It shows the nearest facilities to you based on your location data once you verify your documents.";
            return "That's a good question. When you visit the center or portal, look for the 'Help Desk' or 'May I Help You' section. They will guide you precisely on this matter.";
        };

        faSend.onclick = () => {
            if (!faInput.value.trim()) return;
            const q = faInput.value.trim();
            faInput.value = '';
            
            faHistory.innerHTML += `<div style="margin-bottom: 0.5rem; color: white;"><strong>You:</strong> ${q}</div>`;
            faHistory.scrollTop = faHistory.scrollHeight;
            
            setTimeout(() => {
                const ans = generateFAIAnswer(q);
                faHistory.innerHTML += `<div style="margin-bottom: 0.5rem; color: #48bb78;"><strong>🤖 AI:</strong> ${ans}</div>`;
                faHistory.scrollTop = faHistory.scrollHeight;
            }, 600);
        };
        faInput.onkeypress = (e) => { if (e.key === 'Enter') faSend.onclick(); };
    }

    digilockerBtn.onclick = () => {
        setWorkflowStep(6);
        const s6Pill = document.getElementById('step-6-status-pill');
        if (s6Pill) {
            s6Pill.innerHTML = '🎯 <strong style="color: #48bb78;">Step 6: Application Guidance Active</strong>';
            s6Pill.style.borderColor = '#48bb78';
            s6Pill.style.background = 'rgba(72,187,120,0.15)';
        }
        digilockerBtn.innerHTML = "🔄 Syncing with DigiLocker...";
        setTimeout(() => {
            document.querySelectorAll('.doc-checkbox').forEach(cb => {
                cb.checked = true;
            });
            digilockerBtn.style.display = 'none';
            document.getElementById('digilocker-status').style.display = 'block';
            
            // Enable Apply button
            applyBtn.disabled = false;
            applyBtn.style.cursor = 'pointer';
            applyBtn.style.opacity = '1';
            applyBtn.style.background = 'var(--primary)';
            applyBtn.innerHTML = scheme.applicationMode === 'Offline' ? 'Locate Nearest Center to Apply' : (scheme.applicationMode === 'Both' ? 'Locate Center / Apply Online' : 'Apply Online');
        }, 1200); // Mock delay for realism
    };

    applyBtn.onclick = () => {
        setWorkflowStep(6);
        if (scheme.applicationMode === 'Offline' || scheme.applicationMode === 'Both') {
            if (locationFinder && locationFinder.style.display === 'none') {
                locationFinder.style.display = 'block';
                // Update button text
                if (scheme.applicationMode === 'Both') {
                    applyBtn.innerHTML = 'Or Visit Official Portal Now';
                    applyBtn.onclick = () => openOfficialLink(scheme);
                } else {
                    applyBtn.style.display = 'none'; // Only offline, so map is the final destination in the app
                }
                setTimeout(() => modalBody.scrollTo({top: modalBody.scrollHeight, behavior: 'smooth'}), 100);
                return;
            }
        }
        openOfficialLink(scheme);
    };
};

const openOfficialLink = (scheme) => {
    try {
        if (!scheme || !scheme.officialLink) return;
        window.open(scheme.officialLink, '_blank', 'noopener,noreferrer');
    } catch (e) {
        if (scheme && scheme.officialLink) {
            window.open(scheme.officialLink, '_blank', 'noopener,noreferrer');
        }
    }
};

closeModal.onclick = () => {
    schemeModal.classList.add('hidden-modal');
    setWorkflowStep(4);
};
window.onclick = (e) => { 
    if (e.target === schemeModal) {
        schemeModal.classList.add('hidden-modal');
        setWorkflowStep(4);
    }
};

const renderMatches = (list) => {
    resultsArea.innerHTML = "";
    if (list.length === 0) {
        resultsArea.innerHTML = "<div style='grid-column: 1/-1; text-align: center; padding: 3rem;'><h3>No matches found.</h3><p>Try adjusting your search or completing the discovery again.</p></div>";
    } else {
        list.forEach(s => {
            const div = document.createElement('div');
            div.className = 'scheme-card';
            div.innerHTML = `
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap: 0.4rem;">
                        <div class="card-category" style="margin-bottom:0;">${s.category}</div>
                        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                            ${s.recommendationBadge ? `<span class="rec-badge">${s.recommendationBadge}</span>` : ''}
                            <div style="font-size:0.7rem; font-weight: 600; padding: 3px 8px; border-radius: 8px; background: ${getAppModeDetails(s.applicationMode).bg}; color: ${getAppModeDetails(s.applicationMode).color}; border: 1px solid currentColor;">
                                ${getAppModeDetails(s.applicationMode).text}
                            </div>
                        </div>
                    </div>
                    <h3>${s.name}</h3>
                    <p>${s.description}</p>
                    ${s.highlightReason ? `<div class="rec-reason">🎯 ${s.highlightReason}</div>` : ''}
                    <div style="font-size:0.7rem; color: #a0aec0; margin-top: 0.6rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#48bb78; box-shadow: 0 0 6px #48bb78;"></span>
                        <span>Live Source: <strong style="color: #cbd5e0;">${(() => { try { return new URL(s.officialLink).hostname; } catch(_) { return 'Official Portal'; } })()}</strong></span>
                    </div>
                </div>
                <button class="view-details-btn">View Details & Apply</button>
            `;
            div.querySelector('.view-details-btn').onclick = () => openSchemeModal(s);
            resultsArea.appendChild(div);
        });
    }
};

// Search Logic
smartSearch.oninput = (e) => {
    const filtered = searchByKeyword(currentMatches, e.target.value);
    renderMatches(filtered);
};

// Export Logic
exportBtn.onclick = () => window.print();

if (whatsappShareBtn) {
    whatsappShareBtn.onclick = () => {
        if (!currentMatches || currentMatches.length === 0) return alert("Complete the discovery first to generate a report!");
        let msg = "🇮🇳 *GovNavigator Eligibility Report* 🇮🇳\n\n";
        msg += "Based on my profile, I am eligible for these Government Schemes:\n\n";
        currentMatches.forEach((s, idx) => {
            msg += `*${idx + 1}. ${s.name}*\n`;
            msg += `📄 Category: ${s.category}\n`;
            msg += `🌐 Mode: ${s.applicationMode}\n`;
            msg += `🔗 Link: ${s.officialLink}\n\n`;
        });
        msg += "Powered by *GovNavigator AI*";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const waUrl = isMobile 
            ? `whatsapp://send?text=${encodeURIComponent(msg)}`
            : `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    };
}

let bot = new Chatbot(handleComplete);

// Start a fresh bot session (clears chat and restarts questionnaire)
const startBotFresh = () => {
    bot = new Chatbot(handleComplete);
    chatHistory.innerHTML = '<div class="chat-msg bot">Welcome to GovNavigator AI! I will ask you a few questions to find the perfect schemes for you.</div>';
    interactionArea.innerHTML = '';
    updateUI(bot.getNext());
};

const updateUI = (question) => {
    // If the previous answer resulted in an NLP semantic extraction, render insight bubble
    if (question.nlpInsight) {
        const ins = question.nlpInsight;
        const nlpBubble = document.createElement('div');
        nlpBubble.className = 'nlp-insight-bubble';
        nlpBubble.style.padding = '0.9rem 1.1rem';
        nlpBubble.style.borderRadius = '12px';
        nlpBubble.style.margin = '0.75rem 0';
        nlpBubble.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255, 153, 51, 0.25); padding-bottom: 0.4rem;">
                <span style="color: var(--accent); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                    🧠 <span>NLP Semantic Classifier</span>
                </span>
                <span style="font-size: 0.72rem; color: #48bb78; background: rgba(72,187,120,0.15); border: 1px solid #48bb78; padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                    ${ins.confidence} Confidence
                </span>
            </div>
            <div style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.5;">
                <div>User Input: <code style="color: #63b3ed; background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 4px;">"${ins.input}"</code></div>
                <div style="margin-top: 4px;">Semantic Category: <strong style="color: #48bb78;">${ins.displayName}</strong></div>
                ${ins.isSmallScale ? `<div style="margin-top: 4px; color: #ed8936; font-size: 0.82rem; font-weight: 600;">🏷️ Classified as Small Scale Merchant / Micro-enterprise</div>` : ''}
                ${ins.explanation ? `<div style="margin-top: 4px; font-size: 0.78rem; color: #cbd5e0;">💡 ${ins.explanation}</div>` : ''}
                ${ins.tags && ins.tags.length > 0 ? `
                    <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
                        ${ins.tags.map(t => `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); color: #cbd5e0; padding: 1px 6px; border-radius: 4px;">#${t}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        chatHistory.appendChild(nlpBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    if (question.done) {
        appendMessage("Analysis complete! Building your custom scheme dashboard...", 'bot');
        const profile = bot.profile;
        localStorage.setItem('gov_nav_profile', JSON.stringify(profile));
        userProfile = profile;
        setTimeout(() => switchView('dashboard'), 800);
        bot.onComplete(profile);
        return;
    }

    setWorkflowStep(1); // Profile Collection in progress
    appendMessage(question.text, 'bot');
    interactionArea.innerHTML = "";

    // Specific handler for Age input (0 to 125 yrs)
    if (question.field === 'age') {
        const wrapper = document.createElement('div');
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.gap = "0.5rem";
        wrapper.style.width = "100%";
        wrapper.style.marginBottom = "1rem";

        const row = document.createElement('div');
        row.style.display = "flex";
        row.style.gap = "0.5rem";
        row.style.width = "100%";

        const input = document.createElement('input');
        input.type = "number";
        input.min = "0";
        input.max = "125";
        input.step = "1";
        input.className = 'option-btn';
        input.style.flex = "1";
        input.style.margin = "0";
        input.placeholder = "Enter age (0 - 125 years)";

        const micBtn = document.createElement('button');
        micBtn.className = 'option-btn';
        micBtn.innerHTML = "🎙️";
        micBtn.style.padding = "0.8rem 1rem";
        micBtn.style.margin = "0";
        micBtn.onclick = () => {
             const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
             if (!SpeechRecognition) return alert("Voice input unsupported by your browser.");
             const recognition = new SpeechRecognition();
             recognition.lang = currentLang === 'en' ? 'en-IN' : (currentLang === 'hi' ? 'hi-IN' : 'kn-IN');
             recognition.onstart = () => { micBtn.style.background = "#e53e3e"; input.placeholder = "Listening..."; };
             recognition.onresult = (event) => { input.value = event.results[0][0].transcript; };
             recognition.onend = () => { 
                 micBtn.style.background = "rgba(255,255,255,0.1)"; 
                 if (input.value) submitAge();
             };
             recognition.start();
        };

        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = t('next') || "Next";
        btn.style.width = "auto";
        btn.style.padding = "0.8rem 1.4rem";

        const helper = document.createElement('div');
        helper.className = 'age-helper-note';
        helper.innerHTML = `👶 Age Range: <strong>0 yrs</strong> (Infant / Child Welfare) to <strong>125 yrs</strong> (Super-Senior Pensions)`;

        const submitAge = () => {
            const raw = input.value.trim();
            if (raw === '') return alert("Please enter your age (0 to 125).");
            const num = parseInt(raw, 10);
            if (isNaN(num) || num < 0 || num > 125) {
                return alert("⚠️ Please enter a valid age between 0 and 125 years.");
            }
            appendMessage(`${num} years`, 'user');
            updateUI(bot.answer(String(num)));
        };

        btn.onclick = submitAge;
        input.onkeypress = (e) => { if (e.key === 'Enter') submitAge(); };

        row.appendChild(input);
        row.appendChild(micBtn);
        row.appendChild(btn);
        wrapper.appendChild(row);
        wrapper.appendChild(helper);
        interactionArea.appendChild(wrapper);
        input.focus();
        return;
    }

    // Specific handler for Occupation with NLP Semantic Classification
    if (question.field === 'occupation') {
        const occContainer = document.createElement('div');
        occContainer.style.width = '100%';
        occContainer.style.marginBottom = '1rem';

        const quickButtons = document.createElement('div');
        quickButtons.style.display = 'grid';
        quickButtons.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';
        quickButtons.style.gap = '0.5rem';
        quickButtons.style.marginBottom = '0.8rem';

        const standardRoles = ["Student", "Farmer", "Entrepreneur", "Street Vendor", "Daily Wager", "Artisan", "Employed", "Unemployed"];
        standardRoles.forEach(role => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = role;
            btn.style.margin = '0';
            btn.style.padding = '0.6rem 0.8rem';
            btn.onclick = () => {
                appendMessage(role, 'user');
                updateUI(bot.answer(role));
            };
            quickButtons.appendChild(btn);
        });

        // Dedicated NLP Interactive Card for "Others" / Freeform Natural Language
        const nlpBox = document.createElement('div');
        nlpBox.id = 'nlp-occupation-box';
        nlpBox.style.background = 'rgba(255, 153, 51, 0.08)';
        nlpBox.style.border = '1px solid rgba(255, 153, 51, 0.35)';
        nlpBox.style.borderRadius = '12px';
        nlpBox.style.padding = '0.85rem';

        const nlpTitle = document.createElement('div');
        nlpTitle.style.display = 'flex';
        nlpTitle.style.justifyContent = 'space-between';
        nlpTitle.style.alignItems = 'center';
        nlpTitle.style.marginBottom = '0.5rem';
        nlpTitle.innerHTML = `
            <span style="font-size: 0.82rem; color: var(--accent); font-weight: 700;">✍️ Others / Describe Your Occupation (NLP Powered)</span>
            <span style="font-size: 0.7rem; color: #48bb78; background: rgba(72,187,120,0.15); border: 1px solid #48bb78; padding: 1px 6px; border-radius: 8px;">AI Semantic Engine</span>
        `;

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';

        const nlpInput = document.createElement('input');
        nlpInput.type = 'text';
        nlpInput.className = 'option-btn';
        nlpInput.id = 'nlp-occ-input';
        nlpInput.style.flex = '1';
        nlpInput.style.margin = '0';
        nlpInput.placeholder = 'e.g., "I own a food stall", "tea vendor", "handloom weaver"...';

        const micBtn = document.createElement('button');
        micBtn.className = 'option-btn';
        micBtn.innerHTML = '🎙️';
        micBtn.style.padding = '0.6rem 0.9rem';
        micBtn.style.margin = '0';
        micBtn.onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return alert("Voice input unsupported by your browser.");
            const recognition = new SpeechRecognition();
            recognition.lang = currentLang === 'en' ? 'en-IN' : (currentLang === 'hi' ? 'hi-IN' : 'kn-IN');
            recognition.onstart = () => { micBtn.style.background = "#e53e3e"; nlpInput.placeholder = "Listening..."; };
            recognition.onresult = (event) => { nlpInput.value = event.results[0][0].transcript; };
            recognition.onend = () => { 
                micBtn.style.background = "rgba(255,255,255,0.1)"; 
                if (nlpInput.value) submitNLP();
            };
            recognition.start();
        };

        const submitBtn = document.createElement('button');
        submitBtn.className = 'option-btn';
        submitBtn.id = 'nlp-submit-btn';
        submitBtn.innerHTML = '🤖 Analyze with NLP';
        submitBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
        submitBtn.style.color = 'white';
        submitBtn.style.fontWeight = '700';
        submitBtn.style.margin = '0';
        submitBtn.style.padding = '0.6rem 1.1rem';

        const submitNLP = () => {
            const val = nlpInput.value.trim();
            if (!val) {
                alert("Please type your occupation (e.g., 'I own a food stall').");
                nlpInput.focus();
                return;
            }
            appendMessage(val, 'user');
            updateUI(bot.answer(val));
        };

        submitBtn.onclick = submitNLP;
        nlpInput.onkeypress = (e) => { if (e.key === 'Enter') submitNLP(); };

        const hint = document.createElement('div');
        hint.style.fontSize = '0.74rem';
        hint.style.color = '#a0aec0';
        hint.style.marginTop = '0.4rem';
        hint.innerHTML = `💡 If you own a stall, tea shop, or small enterprise, type it freely — NLP will classify your eligibility for small-scale schemes like PM SVANidhi!`;

        row.appendChild(nlpInput);
        row.appendChild(micBtn);
        row.appendChild(submitBtn);

        nlpBox.appendChild(nlpTitle);
        nlpBox.appendChild(row);
        nlpBox.appendChild(hint);

        // Add "Others" trigger button to quick buttons
        const othersBtn = document.createElement('button');
        othersBtn.className = 'option-btn';
        othersBtn.innerHTML = '✍️ Others (Type with NLP)';
        othersBtn.style.margin = '0';
        othersBtn.style.padding = '0.6rem 0.8rem';
        othersBtn.style.borderColor = 'var(--accent)';
        othersBtn.style.color = 'var(--accent)';
        othersBtn.onclick = () => {
            nlpInput.focus();
            nlpBox.scrollIntoView({ behavior: 'smooth' });
            nlpBox.style.boxShadow = '0 0 15px rgba(255, 153, 51, 0.4)';
            setTimeout(() => { nlpBox.style.boxShadow = 'none'; }, 1500);
        };
        quickButtons.appendChild(othersBtn);

        occContainer.appendChild(quickButtons);
        occContainer.appendChild(nlpBox);
        interactionArea.appendChild(occContainer);
        return;
    }

    if (question.options) {
        if (question.options.length > 5) {
            const select = document.createElement('select');
            select.className = "option-btn";
            select.style.width = "100%";
            select.style.marginBottom = "1rem";
            select.style.background = "rgba(255,255,255,0.1)";
            
            question.options.forEach(opt => {
                const optEl = document.createElement('option');
                optEl.value = opt;
                optEl.innerText = opt;
                optEl.style.background = "#0A0C12";
                select.appendChild(optEl);
            });
            interactionArea.appendChild(select);
            
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = "Submit";
            btn.style.width = "100%";
            btn.onclick = () => {
                const val = select.value;
                appendMessage(val, 'user');
                updateUI(bot.answer(val));
            };
            interactionArea.appendChild(btn);
        } else {
            question.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    appendMessage(opt, 'user');
                    updateUI(bot.answer(opt));
                };
                interactionArea.appendChild(btn);
            });
        }
    } else {
        const wrapper = document.createElement('div');
        wrapper.style.display = "flex";
        wrapper.style.gap = "0.5rem";
        wrapper.style.width = "100%";
        wrapper.style.marginBottom = "1rem";

        const input = document.createElement('input');
        input.type = question.type || "text";
        input.className = 'option-btn';
        input.style.flex = "1";
        input.style.margin = "0";
        input.placeholder = question.placeholder || "Type or Speak...";
        
        const micBtn = document.createElement('button');
        micBtn.className = 'option-btn';
        micBtn.innerHTML = "🎙️";
        micBtn.style.padding = "0.8rem 1rem";
        micBtn.style.margin = "0";
        micBtn.onclick = () => {
             const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
             if (!SpeechRecognition) return alert("Voice input unsupported by your browser.");
             const recognition = new SpeechRecognition();
             recognition.lang = currentLang === 'en' ? 'en-IN' : (currentLang === 'hi' ? 'hi-IN' : 'kn-IN');
             recognition.onstart = () => { micBtn.style.background = "#e53e3e"; input.placeholder = "Listening..."; };
             recognition.onresult = (event) => { input.value = event.results[0][0].transcript; };
             recognition.onend = () => { 
                 micBtn.style.background = "rgba(255,255,255,0.1)"; 
                 if (input.value) { appendMessage(input.value, 'user'); updateUI(bot.answer(input.value)); }
             };
             recognition.start();
        };
        
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = t('next') || "Next";
        btn.onclick = () => {
            if (input.value) {
                appendMessage(input.value, 'user');
                updateUI(bot.answer(input.value));
            }
        };
        input.onkeypress = (e) => {
            if (e.key === 'Enter' && input.value) {
                appendMessage(input.value, 'user');
                updateUI(bot.answer(input.value));
            }
        };
        wrapper.appendChild(input);
        wrapper.appendChild(micBtn);
        interactionArea.appendChild(wrapper);
        interactionArea.appendChild(btn);
        input.focus();
    }
};

// Initial State Check
if (!userProfile) {
    updateUI(bot.getNext());
} else {
    // Show a restart prompt in the interaction area so user can retake discovery
    interactionArea.innerHTML = '';
    const restartMsg = document.createElement('div');
    restartMsg.className = 'chat-msg bot';
    restartMsg.innerText = `Welcome back! Your scheme profile is already saved. Go to Dashboard to see your matched schemes, or click below to retake the discovery questionnaire.`;
    chatHistory.appendChild(restartMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    const restartBtn = document.createElement('button');
    restartBtn.className = 'option-btn';
    restartBtn.innerText = '🔄 Retake Discovery Questionnaire';
    restartBtn.style.width = '100%';
    restartBtn.onclick = () => startBotFresh();
    interactionArea.appendChild(restartBtn);
}

// ----------------- Authentication Handlers -----------------
const openAuthModal = (mode = 'login') => {
    if (!authModal) return;
    authModal.classList.remove('hidden-modal');
    if (authError) {
        authError.style.display = 'none';
        authError.innerText = '';
    }
    
    if (mode === 'signup') {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    } else {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    }
};

const closeAuthModalHandler = () => {
    if (authModal) authModal.classList.add('hidden-modal');
};

if (authBtn) {
    authBtn.onclick = () => {
        if (getCurrentUser()) {
            handleLogout();
        } else {
            openAuthModal('login');
        }
    };
}

if (userBadge) {
    userBadge.onclick = () => switchView('profile');
}

if (navAuthToggle) {
    navAuthToggle.onclick = () => {
        if (getCurrentUser()) {
            handleLogout();
        } else {
            openAuthModal('login');
        }
    };
}

if (profileAuthAction) {
    profileAuthAction.onclick = () => {
        openAuthModal('login');
    };
}

if (closeAuthModal) {
    closeAuthModal.onclick = closeAuthModalHandler;
}

if (authModal) {
    authModal.onclick = (e) => {
        if (e.target === authModal) closeAuthModalHandler();
    };
}

if (tabLogin) {
    tabLogin.onclick = () => openAuthModal('login');
}

if (tabSignup) {
    tabSignup.onclick = () => openAuthModal('signup');
}

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const user = await loginUser({ email, password });
            closeAuthModalHandler();
            userProfile = JSON.parse(localStorage.getItem('gov_nav_profile')) || null;
            updateAuthUI();
            if (userProfile && schemes.length > 0) {
                handleComplete(userProfile);
            } else {
                switchView('profile');
            }
        } catch (err) {
            authError.style.display = 'block';
            authError.innerText = err.message;
        }
    };
}

const signupPasswordInput = document.getElementById('signup-password');
const checkLen = document.getElementById('check-len');
const checkUpper = document.getElementById('check-upper');
const checkLower = document.getElementById('check-lower');
const checkNum = document.getElementById('check-num');
const checkSpec = document.getElementById('check-spec');

if (signupPasswordInput) {
    signupPasswordInput.oninput = (e) => {
        const val = e.target.value;
        const v = validatePassword(val);
        
        if (checkLen) {
            checkLen.innerHTML = v.minLength ? '✔ At least 8 characters' : '✖ At least 8 characters';
            checkLen.style.color = v.minLength ? '#48bb78' : '#fc8181';
        }
        if (checkUpper) {
            checkUpper.innerHTML = v.hasUpper ? '✔ One uppercase letter (A-Z)' : '✖ One uppercase letter (A-Z)';
            checkUpper.style.color = v.hasUpper ? '#48bb78' : '#fc8181';
        }
        if (checkLower) {
            checkLower.innerHTML = v.hasLower ? '✔ One lowercase letter (a-z)' : '✖ One lowercase letter (a-z)';
            checkLower.style.color = v.hasLower ? '#48bb78' : '#fc8181';
        }
        if (checkNum) {
            checkNum.innerHTML = v.hasNumber ? '✔ One number (0-9)' : '✖ One number (0-9)';
            checkNum.style.color = v.hasNumber ? '#48bb78' : '#fc8181';
        }
        if (checkSpec) {
            checkSpec.innerHTML = v.hasSpecial ? '✔ One special symbol (!@#$%^&*)' : '✖ One special symbol (!@#$%^&*)';
            checkSpec.style.color = v.hasSpecial ? '#48bb78' : '#fc8181';
        }
    };
}

if (signupForm) {
    signupForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        // Strict client-side check
        const pwdValidation = validatePassword(password);
        if (!pwdValidation.isValid) {
            authError.style.display = 'block';
            authError.innerText = pwdValidation.message;
            return;
        }

        try {
            const user = await registerUser({ name, email, password, initialProfile: userProfile });
            closeAuthModalHandler();
            updateAuthUI();
            if (userProfile && schemes.length > 0) {
                handleComplete(userProfile);
            } else {
                switchView('discovery');
            }
        } catch (err) {
            authError.style.display = 'block';
            authError.innerText = err.message;
        }
    };
}

if (demoFarmerBtn) {
    demoFarmerBtn.onclick = async () => {
        try {
            await loginUser({ email: 'farmer@demo.gov', password: 'Farmer@2026#' });
            closeAuthModalHandler();
            userProfile = JSON.parse(localStorage.getItem('gov_nav_profile')) || null;
            updateAuthUI();
            if (userProfile && schemes.length > 0) handleComplete(userProfile);
            else switchView('dashboard');
        } catch (err) {
            authError.style.display = 'block';
            authError.innerText = err.message;
        }
    };
}

if (demoStudentBtn) {
    demoStudentBtn.onclick = async () => {
        try {
            await loginUser({ email: 'student@demo.gov', password: 'Student@2026#' });
            closeAuthModalHandler();
            userProfile = JSON.parse(localStorage.getItem('gov_nav_profile')) || null;
            updateAuthUI();
            if (userProfile && schemes.length > 0) handleComplete(userProfile);
            else switchView('dashboard');
        } catch (err) {
            authError.style.display = 'block';
            authError.innerText = err.message;
        }
    };
}

// Initialize Auth Status on startup
updateAuthUI();

// ================================================================
// NOTIFICATION SYSTEM & DETAIL MODAL
// ================================================================

let currentNotifFilter = 'all';

/** Update badge counts in bell, sidebar, drawer, and full page */
const updateNotifBadge = () => {
    const notifs = getStoredNotifications();
    const count = notifs.filter(n => !n.read).length;

    if (notifBadge) {
        notifBadge.textContent = count > 9 ? '9+' : String(count);
        notifBadge.setAttribute('data-count', count);
        notifBadge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (navNotifBadge) {
        navNotifBadge.textContent = count > 9 ? '9+' : String(count);
        navNotifBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (notifPanelCount) {
        notifPanelCount.textContent = count + ' new';
        notifPanelCount.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // Update full page filter counts if elements exist
    const countAllEl = document.getElementById('count-all');
    const countAnnEl = document.getElementById('count-ann');
    const countBenEl = document.getElementById('count-ben');
    const countLiveEl = document.getElementById('count-live');
    if (countAllEl) countAllEl.textContent = notifs.length;
    if (countAnnEl) countAnnEl.textContent = notifs.filter(n => n.type === 'announcement').length;
    if (countBenEl) countBenEl.textContent = notifs.filter(n => n.type === 'benefit_update').length;
    if (countLiveEl) countLiveEl.textContent = notifs.filter(n => n.type === 'portal_live').length;
};

/** Icon by notification type */
const notifTypeIcon = (type) => {
    if (type === 'announcement')   return '📢';
    if (type === 'benefit_update') return '💰';
    if (type === 'portal_live')    return '🌐';
    return '🔔';
};

/** Open a Notification in the full detail modal */
const openNotificationDetail = (notif) => {
    if (!notif) return;

    // Mark single notification as read
    markOneRead(notif.id);
    notif.read = true;
    updateNotifBadge();
    renderNotifPanel();
    if (notificationsView && !notificationsView.classList.contains('view-hidden')) {
        renderNotificationsPage();
    }

    // Find corresponding scheme from loaded schemes or currentMatches
    const scheme = schemes.find(s => s.id === notif.schemeId || (s.name && notif.schemeName && s.name.toLowerCase() === notif.schemeName.toLowerCase()))
        || currentMatches.find(s => s.id === notif.schemeId || (s.name && notif.schemeName && s.name.toLowerCase() === notif.schemeName.toLowerCase()));

    if (notifDetailBody) {
        const typeBadgeClass = notif.type === 'announcement' ? 'announcement' : (notif.type === 'portal_live' ? 'portal_live' : 'benefit_update');
        const typeLabel = notif.type === 'announcement' ? '📢 Official Announcement' : (notif.type === 'portal_live' ? '🌐 Live Portal Ping' : '💰 Benefit Update');
        let domain = 'Official Gov Portal';
        try {
            if (notif.officialLink) domain = new URL(notif.officialLink).hostname;
        } catch (_) {}

        notifDetailBody.innerHTML = `
            <div class="notif-detail-header">
                <div class="notif-detail-tag-row">
                    <span class="notif-detail-badge ${typeBadgeClass}">${typeLabel}</span>
                    ${notif.schemeCategory ? `<span style="background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:20px; font-size:0.75rem; color:#cbd5e0;">${notif.schemeCategory}</span>` : ''}
                    <span style="color:#718096; font-size:0.75rem; margin-left:auto;">🕒 ${notif.timestamp}</span>
                </div>
                <h2 class="notif-detail-title">${notif.title}</h2>
                <div style="font-size:0.85rem; color:#a0aec0; display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem;">
                    <span>🏛 Scheme: <strong style="color:#fff;">${notif.schemeName}</strong></span>
                </div>
            </div>

            <div style="font-size:0.8rem; color:#48bb78; display:flex; align-items:center; gap:0.5rem; background:rgba(72,187,120,0.1); border:1px solid rgba(72,187,120,0.25); border-radius:8px; padding:0.55rem 0.85rem; margin-bottom:1rem;">
                <span class="live-pulse-dot" style="margin:0;"></span>
                <span>Verified live from official portal: <strong style="color:#68d391;">${domain}</strong></span>
            </div>

            <div class="notif-detail-content-box">
                <div style="font-size:0.72rem; text-transform:uppercase; color:#718096; letter-spacing:1px; margin-bottom:0.6rem;">Official Portal Update Details:</div>
                <div style="white-space:pre-wrap; word-break:break-word; color:#f7fafc; font-size:0.95rem; line-height:1.65;">${notif.body}</div>
            </div>

            <div class="notif-detail-actions">
                ${notif.officialLink ? `
                    <a href="${notif.officialLink}" target="_blank" rel="noopener noreferrer" class="apply-btn" style="margin-top:0; padding:0.75rem 1.4rem; font-size:0.88rem; background:linear-gradient(135deg, #2b6cb0, #2c5282); display:inline-flex; align-items:center; gap:0.4rem; text-decoration:none;">
                        🌐 Visit Official Portal ↗
                    </a>
                ` : ''}
                ${scheme ? `
                    <button id="notif-detail-view-scheme" class="option-btn" style="margin:0; padding:0.75rem 1.4rem; font-size:0.88rem; background:linear-gradient(135deg, var(--primary), var(--accent));">
                        📋 View Scheme & Apply
                    </button>
                ` : ''}
                <button id="notif-detail-share-btn" class="option-btn" style="margin:0; padding:0.75rem 1.2rem; font-size:0.88rem; background:rgba(72,187,120,0.2); border:1px solid #48bb78; color:#48bb78;">
                    📲 Share
                </button>
                <button id="notif-detail-close-btn" class="option-btn" style="margin:0; margin-left:auto; padding:0.75rem 1.2rem; font-size:0.88rem; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);">
                    Close
                </button>
            </div>
        `;

        // Wire modal action buttons
        const viewSchemeBtn = document.getElementById('notif-detail-view-scheme');
        if (viewSchemeBtn && scheme) {
            viewSchemeBtn.onclick = () => {
                if (notifDetailModal) notifDetailModal.classList.add('hidden-modal');
                openSchemeModal(scheme);
            };
        }

        const shareBtn = document.getElementById('notif-detail-share-btn');
        if (shareBtn) {
            shareBtn.onclick = () => {
                const text = `*GovNavigator AI Scheme Update*\n\n🏛 *${notif.schemeName}*\n${notif.title}\n\n${notif.body}\n\n🌐 Official Portal: ${notif.officialLink || ''}\n\nCheck your eligibility on GovNavigator AI!`;
                const url = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                    ? `whatsapp://send?text=${encodeURIComponent(text)}`
                    : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            };
        }

        const closeBtn = document.getElementById('notif-detail-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                if (notifDetailModal) notifDetailModal.classList.add('hidden-modal');
            };
        }
    }

    if (notifDetailModal) {
        notifDetailModal.classList.remove('hidden-modal');
    }
};

/** Render the notification panel (slide-out drawer) */
const renderNotifPanel = () => {
    const notifs = getStoredNotifications();
    if (!notifPanelBody) return;

    if (notifs.length === 0) {
        notifPanelBody.innerHTML = `
            <div class="notif-empty-state">
                <div style="font-size:2.5rem; margin-bottom:0.75rem;">🔕</div>
                <div style="color:#a0aec0;">No notifications yet.<br>We'll alert you when your schemes have updates from their official portals.</div>
            </div>`;
        return;
    }

    notifPanelBody.innerHTML = notifs.map(n => {
        const scheme = schemes.find(s => s.id === n.schemeId || (s.name && n.schemeName && s.name.toLowerCase() === n.schemeName.toLowerCase()));
        return `
            <div class="notif-item ${n.read ? '' : 'unread'} type-${n.type}" data-notif-id="${n.id}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                    <div class="notif-item-title">${n.title}</div>
                    ${!n.read ? '<span class="notif-unread-dot" title="Unread"></span>' : ''}
                </div>
                <div class="notif-item-body">${n.body}</div>
                <div class="notif-item-meta">
                    <span style="color:#718096;">${n.schemeCategory || 'Gov Scheme'}</span>
                    <span>${n.timestamp}</span>
                </div>
                <div class="notif-item-actions">
                    <button class="notif-card-btn primary-btn notif-btn-open" data-notif-id="${n.id}">
                        📖 Open Details
                    </button>
                    ${n.officialLink ? `
                        <a href="${n.officialLink}" target="_blank" rel="noopener noreferrer" class="notif-card-btn portal-btn" onclick="event.stopPropagation();">
                            🌐 Portal ↗
                        </a>
                    ` : ''}
                    ${scheme ? `
                        <button class="notif-card-btn notif-btn-scheme" data-scheme-id="${scheme.id}" onclick="event.stopPropagation();">
                            📋 Scheme Info
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Wire clicks on drawer cards
    notifPanelBody.querySelectorAll('.notif-item').forEach(el => {
        const id = el.getAttribute('data-notif-id');
        const notif = notifs.find(n => n.id === id);

        // Entire card click -> open notification detail
        el.onclick = () => {
            openNotificationDetail(notif);
        };

        // Open button click
        const openBtn = el.querySelector('.notif-btn-open');
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.stopPropagation();
                openNotificationDetail(notif);
            };
        }

        // Scheme Info button click
        const schemeBtn = el.querySelector('.notif-btn-scheme');
        if (schemeBtn) {
            schemeBtn.onclick = (e) => {
                e.stopPropagation();
                const schemeId = schemeBtn.getAttribute('data-scheme-id');
                const scheme = schemes.find(s => s.id === schemeId);
                if (scheme) {
                    closeNotifPanel();
                    openSchemeModal(scheme);
                }
            };
        }
    });
};

/** Render the dedicated full Notifications Page */
const renderNotificationsPage = () => {
    if (!notifPageList) return;
    const allNotifs = getStoredNotifications();
    updateNotifBadge();

    // Filter by active pill
    const filtered = currentNotifFilter === 'all'
        ? allNotifs
        : allNotifs.filter(n => n.type === currentNotifFilter);

    if (filtered.length === 0) {
        notifPageList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 1rem; background: var(--glass); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.15);">
                <div style="font-size: 3rem; margin-bottom: 0.75rem;">🔕</div>
                <h3 style="margin: 0 0 0.5rem 0;">No notifications found</h3>
                <p style="color: #a0aec0; margin: 0; font-size: 0.9rem;">
                    ${currentNotifFilter === 'all' ? 'No scheme updates detected yet. Click "Check Portals Now" to poll official portals directly!' : 'No notifications match this filter.'}
                </p>
            </div>
        `;
        return;
    }

    notifPageList.innerHTML = filtered.map(n => {
        const scheme = schemes.find(s => s.id === n.schemeId || (s.name && n.schemeName && s.name.toLowerCase() === n.schemeName.toLowerCase()));
        const typeBadge = n.type === 'announcement' ? '📢 Announcement' : (n.type === 'portal_live' ? '🌐 Live Portal' : '💰 Benefit Update');
        const badgeColor = n.type === 'announcement' ? 'var(--accent)' : (n.type === 'portal_live' ? '#48bb78' : '#63b3ed');
        let domain = 'Official Portal';
        try {
            if (n.officialLink) domain = new URL(n.officialLink).hostname;
        } catch (_) {}

        return `
            <div class="notif-page-card ${n.read ? '' : 'unread'} type-${n.type}" data-notif-id="${n.id}">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem; gap:0.5rem;">
                        <span style="font-size:0.72rem; font-weight:700; color:${badgeColor}; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:3px 8px; border-radius:12px;">
                            ${typeBadge}
                        </span>
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                            ${!n.read ? '<span class="notif-unread-dot" title="Unread"></span>' : ''}
                            <span style="font-size:0.72rem; color:#718096;">${n.timestamp}</span>
                        </div>
                    </div>
                    <h3 style="font-size:1.05rem; margin:0 0 0.4rem 0; line-height:1.3; color:#f7fafc;">${n.title}</h3>
                    <div style="font-size:0.8rem; color:#a0aec0; margin-bottom:0.75rem;">
                        🏛 <strong>${n.schemeName}</strong> ${n.schemeCategory ? `• <span style="color:#718096;">${n.schemeCategory}</span>` : ''}
                    </div>
                    <div style="font-size:0.85rem; color:#cbd5e0; line-height:1.55; margin-bottom:1rem; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                        ${n.body}
                    </div>
                </div>

                <div class="notif-item-actions" style="margin-top:auto;">
                    <button class="notif-card-btn primary-btn notif-page-open-btn" data-notif-id="${n.id}">
                        📖 Read Notice
                    </button>
                    ${n.officialLink ? `
                        <a href="${n.officialLink}" target="_blank" rel="noopener noreferrer" class="notif-card-btn portal-btn" onclick="event.stopPropagation();" title="${n.officialLink}">
                            🌐 ${domain} ↗
                        </a>
                    ` : ''}
                    ${scheme ? `
                        <button class="notif-card-btn notif-page-scheme-btn" data-scheme-id="${scheme.id}" onclick="event.stopPropagation();">
                            📋 Scheme Details
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Wire clicks on page cards
    notifPageList.querySelectorAll('.notif-page-card').forEach(card => {
        const id = card.getAttribute('data-notif-id');
        const notif = allNotifs.find(n => n.id === id);

        card.onclick = () => openNotificationDetail(notif);

        const openBtn = card.querySelector('.notif-page-open-btn');
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.stopPropagation();
                openNotificationDetail(notif);
            };
        }

        const schemeBtn = card.querySelector('.notif-page-scheme-btn');
        if (schemeBtn) {
            schemeBtn.onclick = (e) => {
                e.stopPropagation();
                const schemeId = schemeBtn.getAttribute('data-scheme-id');
                const scheme = schemes.find(s => s.id === schemeId);
                if (scheme) openSchemeModal(scheme);
            };
        }
    });
};

/** Open notification drawer panel */
const openNotifPanel = () => {
    if (!notifPanel) return;
    renderNotifPanel();
    notifPanel.classList.add('open');
    if (notifPanelOverlay) notifPanelOverlay.style.display = 'block';
};

/** Close notification drawer panel */
const closeNotifPanel = () => {
    if (notifPanel) notifPanel.classList.remove('open');
    if (notifPanelOverlay) notifPanelOverlay.style.display = 'none';
};

/** Show a toast popup for a notification */
const showToast = (notif) => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-notif type-${notif.type}`;
    toast.innerHTML = `
        <span class="toast-icon">${notifTypeIcon(notif.type)}</span>
        <div class="toast-content" style="cursor:pointer;">
            <div class="toast-title">${notif.title}</div>
            <div class="toast-body">${notif.body}</div>
        </div>
        <button class="toast-close" title="Dismiss">&times;</button>
        <div class="toast-progress"></div>
    `;

    // Dismiss on close button
    toast.querySelector('.toast-close').onclick = (e) => {
        e.stopPropagation();
        dismissToast(toast);
    };

    // Click toast body — open full notification detail modal directly
    toast.onclick = () => {
        dismissToast(toast);
        openNotificationDetail(notif);
    };

    toastContainer.appendChild(toast);

    // Auto-dismiss after 6 seconds
    setTimeout(() => dismissToast(toast), 6000);
};

const dismissToast = (toast) => {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'toastSlideOut 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
};

/** Callback when new notifications arrive from background polling or manual check */
const onNewNotificationsArrived = (newNotifs) => {
    updateNotifBadge();
    renderNotifPanel();
    if (notificationsView && !notificationsView.classList.contains('view-hidden')) {
        renderNotificationsPage();
    }
    // Show toast for each new notification (max 3 at once)
    newNotifs.slice(0, 3).forEach((n, idx) => {
        setTimeout(() => showToast(n), idx * 700);
    });
    const statusMsg = `✅ Last checked: ${new Date().toLocaleTimeString('en-IN')} — ${newNotifs.length} new update(s) detected`;
    if (notifPollingStatus) notifPollingStatus.textContent = statusMsg;
    if (notifPageStatusText) notifPageStatusText.textContent = statusMsg;
};

// ================================================================
// EVENT LISTENERS & WIRING
// ================================================================

// Bell button: open drawer
if (notifBellBtn) {
    notifBellBtn.onclick = () => openNotifPanel();
}

// Drawer close buttons
if (notifPanelClose) {
    notifPanelClose.onclick = closeNotifPanel;
}
if (notifPanelOverlay) {
    notifPanelOverlay.onclick = closeNotifPanel;
}

// "Full Page ↗" button inside drawer header
if (notifOpenFullBtn) {
    notifOpenFullBtn.onclick = () => {
        switchView('notifications');
        closeNotifPanel();
    };
}

// Mark All Read (drawer & page)
const handleMarkAllRead = () => {
    markAllRead();
    updateNotifBadge();
    renderNotifPanel();
    if (notificationsView && !notificationsView.classList.contains('view-hidden')) {
        renderNotificationsPage();
    }
};

if (notifMarkAllBtn) notifMarkAllBtn.onclick = handleMarkAllRead;
if (notifPageMarkRead) notifPageMarkRead.onclick = handleMarkAllRead;

// Clear All (drawer & page)
const handleClearAll = () => {
    clearAllNotifications();
    updateNotifBadge();
    renderNotifPanel();
    if (notificationsView && !notificationsView.classList.contains('view-hidden')) {
        renderNotificationsPage();
    }
    if (notifPollingStatus) notifPollingStatus.textContent = '⏳ Notifications cleared. Will re-check on next cycle...';
    if (notifPageStatusText) notifPageStatusText.textContent = '⏳ Notifications cleared. Click "Check Portals Now" to poll official links.';
};

if (notifClearBtn) notifClearBtn.onclick = handleClearAll;
if (notifPageClear) notifPageClear.onclick = handleClearAll;

// Close Notification Detail Modal
if (closeNotifDetailModal) {
    closeNotifDetailModal.onclick = () => {
        if (notifDetailModal) notifDetailModal.classList.add('hidden-modal');
    };
}
window.addEventListener('click', (e) => {
    if (e.target === notifDetailModal) {
        notifDetailModal.classList.add('hidden-modal');
    }
});

// Full page filter pills
document.querySelectorAll('.notif-filter-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.notif-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentNotifFilter = btn.getAttribute('data-filter') || 'all';
        renderNotificationsPage();
    };
});

// Manual "Check Portals Now" button
if (notifPageRefresh) {
    notifPageRefresh.onclick = async () => {
        notifPageRefresh.disabled = true;
        notifPageRefresh.innerHTML = '⏳ Checking Official Portals...';
        if (notifPageStatusText) notifPageStatusText.textContent = '🔄 Querying official government portal URLs live...';

        try {
            // Check schemes from currentMatches or schemes dataset
            const targets = (currentMatches && currentMatches.length > 0) ? currentMatches : schemes.slice(0, 6);
            await checkSchemeNotifications(targets, onNewNotificationsArrived);
            renderNotificationsPage();
            renderNotifPanel();
            if (notifPageStatusText) notifPageStatusText.textContent = `✅ Live check complete at ${new Date().toLocaleTimeString('en-IN')}`;
        } catch (err) {
            if (notifPageStatusText) notifPageStatusText.textContent = `⚠️ Check completed with notice: ${err.message}`;
        } finally {
            notifPageRefresh.disabled = false;
            notifPageRefresh.innerHTML = '🔄 Check Portals Now';
        }
    };
}

// Initialize badges on startup
updateNotifBadge();

// Start background polling — feeds from currentMatches (user's eligible schemes)
startNotificationPolling(
    () => (currentMatches && currentMatches.length > 0 ? currentMatches : schemes.slice(0, 6)),
    onNewNotificationsArrived
);

// Immediately sync official gazette bulletins dispatched by administration
syncOfficialBulletins(onNewNotificationsArrived);

// Real-time inter-tab sync via BroadcastChannel
try {
    const bulletinChannel = new BroadcastChannel('gov_nav_bulletins');
    bulletinChannel.onmessage = (event) => {
        syncOfficialBulletins(onNewNotificationsArrived);
        // Refresh schemes in memory
        fetch('/data/schemes.json')
            .then(r => r.json())
            .then(data => {
                schemes = data;
                if (userProfile) handleComplete(userProfile);
            })
            .catch(() => {});
    };
} catch (_) {}

// Also listen to storage events
window.addEventListener('storage', (e) => {
    if (e.key === 'gov_nav_notifications') {
        updateNotifBadge();
        renderNotifPanel();
        if (notificationsView && !notificationsView.classList.contains('view-hidden')) {
            renderNotificationsPage();
        }
    }
});

if (notifPollingStatus) {
    notifPollingStatus.textContent = '⏳ Monitoring official portals for updates...';
}

