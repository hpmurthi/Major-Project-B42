/**
 * GovNavigator AI - Official Admin Governance & Schemes Console Controller
 * Provides authoritative manual scheme entry, human resource revisions,
 * citizen database oversight, and institutional gazette dispatch to citizen profiles.
 */

const ADMIN_SESSION_KEY = 'gov_nav_admin_session';
const ADMIN_CREDENTIALS = {
    email: 'admin@gov.in',
    validPasswords: ['Admin@2026#GovNav', 'Admin@123!', 'Admin@2026#']
};

// State
let allCitizens = [];
let filteredCitizens = [];
let allSchemes = [];
let filteredSchemes = [];
let activeTab = 'schemes'; // 'schemes' | 'citizens'

// DOM Elements - Authentication
const adminLoginSection = document.getElementById('admin-login-section');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const adminLoginForm = document.getElementById('admin-login-form');
const adminAuthError = document.getElementById('admin-auth-error');
const adminDemoBtn = document.getElementById('admin-demo-btn');
const adminUserInfo = document.getElementById('admin-user-info');
const adminEmailDisplay = document.getElementById('admin-email-display');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Tab Navigation
const tabBtnSchemes = document.getElementById('tab-btn-schemes');
const tabBtnCitizens = document.getElementById('tab-btn-citizens');
const tabContentSchemes = document.getElementById('tab-content-schemes');
const tabContentCitizens = document.getElementById('tab-content-citizens');
const tabSchemesCount = document.getElementById('tab-schemes-count');
const tabCitizensCount = document.getElementById('tab-citizens-count');

// Scheme KPIs & Controls
const statTotalSchemesCount = document.getElementById('stat-total-schemes-count');
const statTotalCategoriesCount = document.getElementById('stat-total-categories-count');
const statCentralStateRatio = document.getElementById('stat-central-state-ratio');
const schemeSearchInput = document.getElementById('scheme-search-input');
const filterSchemeCategory = document.getElementById('filter-scheme-category');
const filterSchemeMode = document.getElementById('filter-scheme-mode');
const filterSchemeOccupation = document.getElementById('filter-scheme-occupation');
const filterSchemeLocation = document.getElementById('filter-scheme-location');
const schemesFilteredCountDisplay = document.getElementById('schemes-filtered-count-display');
const schemesRecordsContainer = document.getElementById('schemes-records-container');

// Citizen KPIs & Controls
const statTotalCitizens = document.getElementById('stat-total-citizens');
const statTotalMatches = document.getElementById('stat-total-matches');
const statAvgSchemes = document.getElementById('stat-avg-schemes');
const adminSearch = document.getElementById('admin-search');
const filterOccupation = document.getElementById('filter-occupation');
const filterState = document.getElementById('filter-state');
const filteredCountDisplay = document.getElementById('filtered-count-display');
const citizensRecordsContainer = document.getElementById('citizens-records-container');

// Action Buttons
const adminAddSchemeBtn = document.getElementById('admin-add-scheme-btn');
const navBtnAddScheme = document.getElementById('nav-btn-add-scheme');
const btnQuickNewScheme = document.getElementById('btn-quick-new-scheme');
const adminDownloadJsonBtn = document.getElementById('admin-download-json-btn');
const adminExportCsvBtn = document.getElementById('admin-export-csv-btn');

// Scheme Modal Elements
const adminSchemeModal = document.getElementById('admin-scheme-modal');
const closeSchemeModalBtn = document.getElementById('close-scheme-modal-btn');
const cancelSchemeModalBtn = document.getElementById('cancel-scheme-modal-btn');
const adminSchemeForm = document.getElementById('admin-scheme-form');
const modalSchemeTitle = document.getElementById('modal-scheme-title');

// Form Inputs
const formSchemeId = document.getElementById('form-scheme-id');
const formSchemeName = document.getElementById('form-scheme-name');
const formSchemeCategory = document.getElementById('form-scheme-category');
const formSchemeCategoryOther = document.getElementById('form-scheme-category-other');
const categoryOtherWrapper = document.getElementById('category-other-wrapper');
const formSchemeMinistry = document.getElementById('form-scheme-ministry');
const formSchemeMode = document.getElementById('form-scheme-mode');
const formSchemeDeadline = document.getElementById('form-scheme-deadline');
const formSchemeLink = document.getElementById('form-scheme-link');
const formSchemeDesc = document.getElementById('form-scheme-desc');
const formSchemeBenefits = document.getElementById('form-scheme-benefits');
const formSchemeSteps = document.getElementById('form-scheme-steps');
const formSchemeDocs = document.getElementById('form-scheme-docs');
const formSchemeMinAge = document.getElementById('form-scheme-min-age');
const formSchemeMaxAge = document.getElementById('form-scheme-max-age');
const formSchemeGender = document.getElementById('form-scheme-gender');
const formSchemeIncome = document.getElementById('form-scheme-income');
const formSchemeLocation = document.getElementById('form-scheme-location');
const formSchemeDisability = document.getElementById('form-scheme-disability');
const formSchemeOccOther = document.getElementById('form-scheme-occ-other');
const occCheckboxOther = document.getElementById('occ-checkbox-other');
const formBulletinTitle = document.getElementById('form-bulletin-title');
const formBulletinType = document.getElementById('form-bulletin-type');
const formBulletinBody = document.getElementById('form-bulletin-body');

const adminToastContainer = document.getElementById('admin-toast-container');

// Broadcast Channel for instantaneous multi-tab sync
let syncChannel = null;
try {
    syncChannel = new BroadcastChannel('gov_nav_bulletins');
} catch (_) {}

/**
 * Check if admin is currently authenticated
 */
function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

/**
 * Display toast notification inside admin portal
 */
function showAdminToast(message, type = 'success') {
    if (!adminToastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-admin-feedback';
    if (type === 'error') {
        toast.style.borderColor = 'var(--admin-danger)';
    }
    toast.innerHTML = `
        <span style="font-size: 1.3rem;">${type === 'error' ? '⚠️' : '✅'}</span>
        <span>${message}</span>
    `;
    adminToastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        setTimeout(() => toast.remove(), 350);
    }, 4500);
}

/**
 * Switch between Login Screen and Protected Admin Dashboard
 */
function updateAdminView() {
    if (isAdminLoggedIn()) {
        if (adminLoginSection) adminLoginSection.style.display = 'none';
        if (adminDashboardSection) adminDashboardSection.style.display = 'block';
        if (adminUserInfo) adminUserInfo.style.display = 'flex';
        if (adminEmailDisplay) adminEmailDisplay.innerText = ADMIN_CREDENTIALS.email;

        // Fetch data
        loadSchemesData();
        loadCitizensData();
    } else {
        if (adminLoginSection) adminLoginSection.style.display = 'block';
        if (adminDashboardSection) adminDashboardSection.style.display = 'none';
        if (adminUserInfo) adminUserInfo.style.display = 'none';
    }
}

/**
 * Handle Admin Authentication
 */
function attemptAdminLogin(email, password) {
    const isEmailValid = email && email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
    const isPwdValid = ADMIN_CREDENTIALS.validPasswords.includes(password);

    if (isEmailValid && isPwdValid) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        if (adminAuthError) adminAuthError.style.display = 'none';
        updateAdminView();
        showAdminToast('Welcome, Administrator. Welfare Governance Console authenticated.');
    } else {
        if (adminAuthError) {
            adminAuthError.style.display = 'block';
            adminAuthError.innerText = 'Invalid official credentials. Accepted passwords: Admin@2026#GovNav or Admin@123!';
        }
    }
}

if (adminLoginForm) {
    adminLoginForm.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        attemptAdminLogin(email, password);
    };
}

if (adminDemoBtn) {
    adminDemoBtn.onclick = () => {
        const emailInput = document.getElementById('admin-email');
        const pwdInput = document.getElementById('admin-password');
        if (emailInput) emailInput.value = ADMIN_CREDENTIALS.email;
        if (pwdInput) pwdInput.value = 'Admin@2026#GovNav';
        attemptAdminLogin(ADMIN_CREDENTIALS.email, 'Admin@2026#GovNav');
    };
}

if (adminLogoutBtn) {
    adminLogoutBtn.onclick = () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        updateAdminView();
    };
}

// ================================================================
// TAB NAVIGATION
// ================================================================

function switchTab(target) {
    activeTab = target;
    if (target === 'schemes') {
        tabBtnSchemes.classList.add('active');
        tabBtnCitizens.classList.remove('active');
        tabContentSchemes.classList.remove('hidden');
        tabContentCitizens.classList.add('hidden');
    } else {
        tabBtnCitizens.classList.add('active');
        tabBtnSchemes.classList.remove('active');
        tabContentCitizens.classList.remove('hidden');
        tabContentSchemes.classList.add('hidden');
    }
}

if (tabBtnSchemes) tabBtnSchemes.onclick = () => switchTab('schemes');
if (tabBtnCitizens) tabBtnCitizens.onclick = () => switchTab('citizens');

// ================================================================
// SCHEMES MANAGEMENT LOGIC
// ================================================================

/**
 * Fetch all schemes from /api/schemes
 */
async function loadSchemesData() {
    if (schemesRecordsContainer) {
        schemesRecordsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #a0aec0;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
                Loading official schemes registry...
            </div>
        `;
    }

    try {
        const res = await fetch('/api/schemes');
        const data = await res.json();
        allSchemes = data.schemes || [];
        populateSchemeFilters(allSchemes);
        applySchemeFiltersAndRender();
        updateSchemeKpis(allSchemes);
        if (tabSchemesCount) tabSchemesCount.innerText = allSchemes.length;
    } catch (err) {
        if (schemesRecordsContainer) {
            schemesRecordsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #fc8181;">
                    Failed to connect to schemes service: ${err.message}
                </div>
            `;
        }
    }
}

/**
 * Update Scheme Metrics KPI Cards
 */
function updateSchemeKpis(schemes) {
    const total = schemes.length;
    const categories = new Set(schemes.map(s => s.category).filter(Boolean));
    const centralCount = schemes.filter(s => !s.eligibility?.location || s.eligibility.location === 'Central' || s.eligibility.location === 'All India').length;
    const stateCount = total - centralCount;

    if (statTotalSchemesCount) statTotalSchemesCount.innerText = total;
    if (statTotalCategoriesCount) statTotalCategoriesCount.innerText = categories.size;
    if (statCentralStateRatio) statCentralStateRatio.innerText = `${centralCount} / ${stateCount}`;
}

/**
 * Populate dynamic category filter dropdown
 */
function populateSchemeFilters(schemes) {
    if (!filterSchemeCategory) return;
    const categories = new Set(schemes.map(s => s.category).filter(Boolean));

    filterSchemeCategory.innerHTML = '<option value="">All Categories</option>';
    Array.from(categories).sort().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        filterSchemeCategory.appendChild(opt);
    });
}

/**
 * Filter & Render Scheme Cards
 */
function applySchemeFiltersAndRender() {
    const q = (schemeSearchInput?.value || '').toLowerCase().trim();
    const cat = filterSchemeCategory?.value || '';
    const mode = filterSchemeMode?.value || '';
    const occ = filterSchemeOccupation?.value || '';
    const loc = filterSchemeLocation?.value || '';

    filteredSchemes = allSchemes.filter(s => {
        // Query match
        const matchQuery = !q || (
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.ministry && s.ministry.toLowerCase().includes(q)) ||
            (s.category && s.category.toLowerCase().includes(q)) ||
            (s.description && s.description.toLowerCase().includes(q)) ||
            (Array.isArray(s.benefits) && s.benefits.join(' ').toLowerCase().includes(q)) ||
            (Array.isArray(s.eligibility?.occupation) && s.eligibility.occupation.join(' ').toLowerCase().includes(q))
        );

        // Category match
        const matchCat = !cat || (s.category && s.category.toLowerCase() === cat.toLowerCase());

        // Application Mode match (Both, Online, Offline, CSC, Bank, Gram Panchayat, Post Office, Mobile App, Other)
        let matchMode = true;
        if (mode) {
            const sMode = (s.applicationMode || '').toLowerCase();
            if (mode === 'Both') {
                matchMode = sMode.includes('both') || (sMode.includes('online') && sMode.includes('offline'));
            } else if (mode === 'Online') {
                matchMode = sMode.includes('online') || sMode.includes('both');
            } else if (mode === 'Offline') {
                matchMode = sMode.includes('offline') || sMode.includes('both') || sMode.includes('csc') || sMode.includes('bank') || sMode.includes('panchayat') || sMode.includes('post');
            } else if (mode === 'CSC Center') {
                matchMode = sMode.includes('csc') || sMode.includes('center');
            } else if (mode === 'Bank Branch') {
                matchMode = sMode.includes('bank');
            } else if (mode === 'Gram Panchayat') {
                matchMode = sMode.includes('panchayat') || sMode.includes('municipal');
            } else if (mode === 'Post Office') {
                matchMode = sMode.includes('post');
            } else if (mode === 'Mobile App') {
                matchMode = sMode.includes('app') || sMode.includes('umang');
            } else if (mode === 'Other') {
                matchMode = sMode.includes('other') || (!sMode.includes('online') && !sMode.includes('offline') && !sMode.includes('both'));
            }
        }

        // Occupation match
        let matchOcc = true;
        if (occ) {
            const sOccs = (s.eligibility?.occupation || []).map(o => o.toLowerCase());
            if (sOccs.includes('all') || sOccs.includes('any')) {
                matchOcc = true;
            } else if (occ === 'Other') {
                const standardCanonical = ['farmer', 'student', 'entrepreneur', 'street vendor', 'artisan', 'daily wager', 'employed', 'self-employed', 'unemployed', 'homemaker', 'healthcare worker', 'sanitation worker', 'senior citizen', 'ex-serviceman'];
                matchOcc = sOccs.includes('other') || sOccs.some(o => !standardCanonical.includes(o));
            } else {
                matchOcc = sOccs.includes(occ.toLowerCase()) || sOccs.some(o => o.includes(occ.toLowerCase()) || occ.toLowerCase().includes(o));
            }
        }

        // Location match
        let matchLoc = true;
        if (loc === 'Central') {
            matchLoc = !s.eligibility?.location || s.eligibility.location === 'Central' || s.eligibility.location === 'All India';
        } else if (loc) {
            matchLoc = s.eligibility?.location === loc;
        }

        return matchQuery && matchCat && matchMode && matchOcc && matchLoc;
    });

    if (schemesFilteredCountDisplay) {
        schemesFilteredCountDisplay.innerText = `Showing ${filteredSchemes.length} of ${allSchemes.length} schemes`;
    }
    renderSchemeCards(filteredSchemes);
}

if (schemeSearchInput) schemeSearchInput.oninput = applySchemeFiltersAndRender;
if (filterSchemeCategory) filterSchemeCategory.onchange = applySchemeFiltersAndRender;
if (filterSchemeMode) filterSchemeMode.onchange = applySchemeFiltersAndRender;
if (filterSchemeOccupation) filterSchemeOccupation.onchange = applySchemeFiltersAndRender;
if (filterSchemeLocation) filterSchemeLocation.onchange = applySchemeFiltersAndRender;

/**
 * Render individual scheme cards
 */
function renderSchemeCards(list) {
    if (!schemesRecordsContainer) return;

    if (list.length === 0) {
        schemesRecordsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: var(--admin-card-bg); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.15);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No schemes matched your search criteria.</h3>
                <p style="color: #a0aec0; font-size: 0.85rem; margin-top: 0.5rem;">Try modifying your keyword, mode or occupation filter or click "Formulate New Scheme".</p>
            </div>
        `;
        return;
    }

    schemesRecordsContainer.innerHTML = list.map(s => {
        const elig = s.eligibility || {};
        const isCentral = !elig.location || elig.location === 'Central' || elig.location === 'All India';
        const locLabel = isCentral ? 'Pan-India / Central' : elig.location;
        const occupations = Array.isArray(elig.occupation) && elig.occupation.length > 0 ? elig.occupation.join(', ') : 'All Occupations';
        const ageRange = elig.minAge !== undefined || elig.maxAge !== undefined ? `${elig.minAge ?? 0} - ${elig.maxAge ?? 125} yrs` : 'Any Age';
        const benefitsArr = Array.isArray(s.benefits) ? s.benefits : [s.benefits || s.description];

        const sMode = s.applicationMode || 'Online';
        let modeClass = 'mode-online';
        let modeIcon = '🌐';
        const sModeLower = sMode.toLowerCase();
        if (sModeLower.includes('both') || (sModeLower.includes('online') && sModeLower.includes('offline'))) {
            modeClass = 'mode-both';
            modeIcon = '🔄';
        } else if (sModeLower.includes('offline')) {
            modeClass = 'mode-offline';
            modeIcon = '🏢';
        } else if (sModeLower.includes('csc') || sModeLower.includes('center')) {
            modeClass = 'mode-csc';
            modeIcon = '📍';
        } else if (sModeLower.includes('bank')) {
            modeClass = 'mode-offline';
            modeIcon = '🏦';
        } else if (sModeLower.includes('panchayat') || sModeLower.includes('municipal')) {
            modeClass = 'mode-csc';
            modeIcon = '🏛';
        } else if (sModeLower.includes('post')) {
            modeClass = 'mode-offline';
            modeIcon = '📮';
        } else if (sModeLower.includes('app')) {
            modeClass = 'mode-online';
            modeIcon = '📱';
        } else {
            modeClass = 'mode-csc';
            modeIcon = '📝';
        }

        return `
            <div class="scheme-admin-card" data-scheme-id="${s.id}">
                <div>
                    <div class="scheme-header-row">
                        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                            <span class="scheme-tag cat">${s.category || 'General'}</span>
                            <span class="scheme-tag ${modeClass}">${modeIcon} ${sMode}</span>
                            <span class="scheme-tag central">${locLabel}</span>
                        </div>
                        <span style="font-size: 0.72rem; color: #718096;">ID: ${s.id}</span>
                    </div>

                    <h3 style="font-size: 1.15rem; font-weight: 700; color: white; margin: 0 0 0.4rem 0; line-height: 1.35;">
                        ${s.name}
                    </h3>
                    <div style="font-size: 0.78rem; color: #a0aec0; margin-bottom: 0.75rem;">
                        🏛 ${s.ministry || 'Nodal Ministry / Department'}
                    </div>

                    <div style="font-size: 0.82rem; color: #cbd5e0; line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${s.description || benefitsArr[0] || ''}
                    </div>

                    <!-- Benefits Highlight -->
                    <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 0.75rem; border-left: 3px solid var(--admin-accent); margin-bottom: 1rem;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; color: #718096; font-weight: 700; margin-bottom: 0.3rem;">Key Provisions:</div>
                        <div style="font-size: 0.8rem; color: #68d391; font-weight: 600;">
                            ${benefitsArr.slice(0, 2).map(b => `• ${b}`).join('<br>')}
                        </div>
                    </div>

                    <!-- Eligibility Snapshot -->
                    <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem;">
                        <span class="demographic-pill">🎯 ${occupations}</span>
                        <span class="demographic-pill">🎂 ${ageRange}</span>
                        ${elig.maxIncome ? `<span class="demographic-pill">💰 ≤ ₹${elig.maxIncome.toLocaleString()}</span>` : ''}
                    </div>
                </div>

                <!-- Action Toolbar -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="action-btn-sm btn-edit btn-trigger-edit-scheme" data-scheme-id="${s.id}">
                            ✏️ Edit & Revise
                        </button>
                        <button class="action-btn-sm btn-delete btn-trigger-delete-scheme" data-scheme-id="${s.id}" data-scheme-name="${s.name.replace(/"/g, '&quot;')}">
                            🗑️
                        </button>
                    </div>

                    <a href="${s.officialLink}" target="_blank" rel="noopener noreferrer" style="color: var(--admin-accent); font-size: 0.78rem; text-decoration: none; border: 1px solid var(--admin-accent); padding: 5px 10px; border-radius: 6px; font-weight: 600;">
                        Official Portal ↗
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Event Delegation for Scheme Card clicks (100% reliable, no inline quotes)
if (schemesRecordsContainer) {
    schemesRecordsContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-trigger-edit-scheme');
        if (editBtn) {
            const id = editBtn.getAttribute('data-scheme-id');
            openSchemeFormModal(id);
            return;
        }

        const deleteBtn = e.target.closest('.btn-trigger-delete-scheme');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-scheme-id');
            const name = deleteBtn.getAttribute('data-scheme-name');
            handleDeleteScheme(id, name);
            return;
        }
    });
}

// Category custom toggle
if (formSchemeCategory) {
    formSchemeCategory.addEventListener('change', () => {
        if (categoryOtherWrapper) {
            const isOther = formSchemeCategory.value === 'Other';
            categoryOtherWrapper.style.display = isOther ? 'block' : 'none';
            if (isOther && formSchemeCategoryOther) formSchemeCategoryOther.focus();
        }
    });
}

// Quick insert tags for custom occupations
document.addEventListener('click', (e) => {
    const pill = e.target.closest('.quick-occ-pill');
    if (pill) {
        const val = pill.getAttribute('data-val');
        if (occCheckboxOther) occCheckboxOther.checked = true;
        if (formSchemeOccOther) {
            const cur = formSchemeOccOther.value.trim();
            if (!cur) {
                formSchemeOccOther.value = val;
            } else if (!cur.toLowerCase().includes(val.toLowerCase())) {
                formSchemeOccOther.value = `${cur}, ${val}`;
            }
            formSchemeOccOther.focus();
        }
        const allCb = document.querySelector('input[name="form-occ"][value="All"]');
        if (allCb) allCb.checked = false;
    }
});

// Mutual exclusivity: 'All Occupations' vs specific occupations
document.querySelectorAll('input[name="form-occ"]').forEach(cb => {
    cb.addEventListener('change', () => {
        const allCb = document.querySelector('input[name="form-occ"][value="All"]');
        if (cb.value === 'All') {
            if (cb.checked) {
                document.querySelectorAll('input[name="form-occ"]').forEach(other => {
                    if (other !== cb) other.checked = false;
                });
                if (formSchemeOccOther) formSchemeOccOther.value = '';
            }
        } else {
            if (cb.checked && allCb) {
                allCb.checked = false;
            }
            const anyChecked = Array.from(document.querySelectorAll('input[name="form-occ"]')).some(c => c.checked);
            if (!anyChecked && allCb) {
                allCb.checked = true;
            }
        }
    });
});

/**
 * Open Scheme Formulation / Revision Modal
 * @param {string|null} schemeId - Existing scheme ID or null for brand new scheme
 */
function openSchemeFormModal(schemeId = null) {
    if (!adminSchemeModal) return;

    adminSchemeForm.reset();
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (schemeId) {
        // Edit Mode
        const scheme = allSchemes.find(s => s.id === schemeId);
        if (!scheme) return;

        modalSchemeTitle.innerText = `Edit & Revise: ${scheme.name}`;
        formSchemeId.value = scheme.id;
        formSchemeName.value = scheme.name || '';

        // Category prefill (supports existing + custom Other)
        const categoryOptions = Array.from(formSchemeCategory.options).map(o => o.value);
        if (categoryOptions.includes(scheme.category)) {
            formSchemeCategory.value = scheme.category;
            if (categoryOtherWrapper) categoryOtherWrapper.style.display = 'none';
            if (formSchemeCategoryOther) formSchemeCategoryOther.value = '';
        } else {
            formSchemeCategory.value = 'Other';
            if (categoryOtherWrapper) categoryOtherWrapper.style.display = 'block';
            if (formSchemeCategoryOther) formSchemeCategoryOther.value = scheme.category || '';
        }

        formSchemeMinistry.value = scheme.ministry || '';

        // Application Mode prefill (Both, Online, Offline, CSC Center, Bank Branch, Gram Panchayat, Post Office, Mobile App, Other)
        const modeOptions = Array.from(formSchemeMode.options).map(o => o.value);
        if (modeOptions.includes(scheme.applicationMode)) {
            formSchemeMode.value = scheme.applicationMode;
        } else {
            const smLower = (scheme.applicationMode || '').toLowerCase();
            if (smLower.includes('both')) formSchemeMode.value = 'Both';
            else if (smLower.includes('online')) formSchemeMode.value = 'Online';
            else if (smLower.includes('offline')) formSchemeMode.value = 'Offline';
            else if (smLower.includes('csc') || smLower.includes('center')) formSchemeMode.value = 'CSC Center';
            else if (smLower.includes('bank')) formSchemeMode.value = 'Bank Branch';
            else if (smLower.includes('panchayat') || smLower.includes('municipal')) formSchemeMode.value = 'Gram Panchayat / Municipal Office';
            else if (smLower.includes('post')) formSchemeMode.value = 'Post Office';
            else if (smLower.includes('app')) formSchemeMode.value = 'Mobile App';
            else formSchemeMode.value = 'Other';
        }

        formSchemeDeadline.value = scheme.deadline || '';
        formSchemeLink.value = scheme.officialLink || '';
        formSchemeDesc.value = scheme.description || '';
        
        const benefitsArr = Array.isArray(scheme.benefits) ? scheme.benefits : [scheme.benefits || ''];
        formSchemeBenefits.value = benefitsArr.join('\n');

        const stepsArr = Array.isArray(scheme.applicationSteps) ? scheme.applicationSteps : [scheme.applicationSteps || ''];
        formSchemeSteps.value = stepsArr.join('\n');

        const docsArr = Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments : [scheme.requiredDocuments || ''];
        formSchemeDocs.value = docsArr.join(', ');

        const elig = scheme.eligibility || {};
        formSchemeMinAge.value = elig.minAge !== undefined ? elig.minAge : 0;
        formSchemeMaxAge.value = elig.maxAge !== undefined ? elig.maxAge : 125;
        formSchemeGender.value = elig.gender && elig.gender.length === 1 ? elig.gender[0] : 'Any';
        formSchemeIncome.value = elig.maxIncome || '';
        formSchemeLocation.value = elig.location || 'Central';
        formSchemeDisability.value = elig.disabledOnly ? 'true' : 'false';

        // Checkboxes & Custom descriptor for occupation
        const targetOccs = elig.occupation || ['All'];
        const standardOccValues = [
            'All', 'Farmer', 'Student', 'Entrepreneur', 'Street Vendor', 'Artisan',
            'Daily Wager', 'Employed', 'Self-Employed', 'Unemployed', 'Homemaker',
            'Healthcare Worker', 'Sanitation Worker', 'Senior Citizen', 'Ex-Serviceman'
        ];
        const customOccs = [];

        document.querySelectorAll('input[name="form-occ"]').forEach(cb => {
            if (cb.value === 'Other') {
                cb.checked = false;
            } else {
                cb.checked = targetOccs.includes(cb.value);
            }
        });

        targetOccs.forEach(o => {
            if (!standardOccValues.includes(o) && o !== 'Other') {
                customOccs.push(o);
            }
        });

        if (targetOccs.includes('Other') || customOccs.length > 0) {
            if (occCheckboxOther) occCheckboxOther.checked = true;
            if (formSchemeOccOther) formSchemeOccOther.value = customOccs.join(', ');
        } else {
            if (occCheckboxOther) occCheckboxOther.checked = false;
            if (formSchemeOccOther) formSchemeOccOther.value = '';
        }

        // Pre-fill Institutional Gazette Bulletin section
        formBulletinTitle.value = `📋 Official Scheme Revision: ${scheme.name}`;
        formBulletinType.value = 'benefit_update';
        formBulletinBody.value = `Official Welfare Gazette (${todayStr}): The guidelines, benefits, and operational provisions for '${scheme.name}' have been revised by the nodal department. Primary benefits: ${benefitsArr.slice(0, 2).join('; ')}. Eligible citizens are advised to check guidelines and apply on the official portal.`;
    } else {
        // Create Mode
        modalSchemeTitle.innerText = 'Formulate New Government Scheme';
        formSchemeId.value = '';
        formSchemeCategory.value = 'Agriculture';
        if (categoryOtherWrapper) categoryOtherWrapper.style.display = 'none';
        if (formSchemeCategoryOther) formSchemeCategoryOther.value = '';
        formSchemeMode.value = 'Both';
        formSchemeMinAge.value = 0;
        formSchemeMaxAge.value = 125;
        formSchemeGender.value = 'Any';
        formSchemeLocation.value = 'Central';
        formSchemeDisability.value = 'false';

        document.querySelectorAll('input[name="form-occ"]').forEach(cb => {
            cb.checked = cb.value === 'All';
        });
        if (occCheckboxOther) occCheckboxOther.checked = false;
        if (formSchemeOccOther) formSchemeOccOther.value = '';

        formBulletinTitle.value = '';
        formBulletinType.value = 'announcement';
        formBulletinBody.value = '';
    }

    adminSchemeModal.classList.remove('hidden');
}

function closeSchemeFormModal() {
    if (adminSchemeModal) adminSchemeModal.classList.add('hidden');
}

if (closeSchemeModalBtn) closeSchemeModalBtn.onclick = closeSchemeFormModal;
if (cancelSchemeModalBtn) cancelSchemeModalBtn.onclick = closeSchemeFormModal;

if (adminAddSchemeBtn) adminAddSchemeBtn.onclick = () => openSchemeFormModal(null);
if (navBtnAddScheme) navBtnAddScheme.onclick = () => openSchemeFormModal(null);
if (btnQuickNewScheme) btnQuickNewScheme.onclick = () => openSchemeFormModal(null);

// Close on backdrop click
if (adminSchemeModal) {
    adminSchemeModal.onclick = (e) => {
        if (e.target === adminSchemeModal) closeSchemeFormModal();
    };
}

/**
 * Handle Scheme Save Submission
 */
if (adminSchemeForm) {
    adminSchemeForm.onsubmit = async (e) => {
        e.preventDefault();

        const selectedOccs = [];
        document.querySelectorAll('input[name="form-occ"]:checked').forEach(cb => {
            if (cb.value !== 'Other') {
                selectedOccs.push(cb.value);
            }
        });

        const customOccText = formSchemeOccOther?.value?.trim() || '';
        if (occCheckboxOther?.checked || customOccText) {
            if (customOccText) {
                const parts = customOccText.split(/,|\n/).map(p => p.trim()).filter(Boolean);
                parts.forEach(p => {
                    if (!selectedOccs.includes(p)) selectedOccs.push(p);
                });
            } else {
                if (!selectedOccs.includes('Other')) selectedOccs.push('Other');
            }
        }

        let finalCategory = formSchemeCategory.value;
        if (finalCategory === 'Other') {
            const customCat = formSchemeCategoryOther?.value?.trim();
            finalCategory = customCat || 'General Welfare';
        }

        const benefitsLines = formSchemeBenefits.value.split('\n').map(b => b.trim()).filter(Boolean);
        const stepsLines = formSchemeSteps.value.split('\n').map(s => s.trim()).filter(Boolean);
        const docsArr = formSchemeDocs.value.split(/,|\n/).map(d => d.trim()).filter(Boolean);

        const schemePayload = {
            id: formSchemeId.value || undefined,
            name: formSchemeName.value.trim(),
            category: finalCategory,
            ministry: formSchemeMinistry.value.trim() || 'Ministry of Social Justice and Empowerment',
            applicationMode: formSchemeMode.value,
            deadline: formSchemeDeadline.value.trim() || 'Active Enrollment',
            officialLink: formSchemeLink.value.trim(),
            description: formSchemeDesc.value.trim(),
            benefits: benefitsLines.length > 0 ? benefitsLines : [formSchemeDesc.value.trim()],
            applicationSteps: stepsLines,
            requiredDocuments: docsArr,
            eligibility: {
                minAge: formSchemeMinAge.value ? Number(formSchemeMinAge.value) : 0,
                maxAge: formSchemeMaxAge.value ? Number(formSchemeMaxAge.value) : 125,
                gender: formSchemeGender.value === 'Any' ? ['Male', 'Female', 'Other'] : [formSchemeGender.value],
                maxIncome: formSchemeIncome.value ? Number(formSchemeIncome.value) : undefined,
                location: formSchemeLocation.value || 'Central',
                occupation: selectedOccs.length > 0 ? selectedOccs : ['All'],
                disabledOnly: formSchemeDisability.value === 'true'
            }
        };

        const bulletinPayload = {
            title: formBulletinTitle.value.trim(),
            type: formBulletinType.value,
            summary: formBulletinBody.value.trim()
        };

        try {
            const submitBtn = document.getElementById('save-scheme-submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = '⏳ Publishing to Registry...';
            }

            const res = await fetch('/api/schemes/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheme: schemePayload, bulletin: bulletinPayload })
            });
            const data = await res.json();

            if (data.success) {
                closeSchemeFormModal();
                showAdminToast(`✅ Scheme '${data.scheme.name}' published! Official Gazette notification dispatched to citizen profiles.`);

                // Immediately sync to citizen browser storage for instant real-time reflection
                if (data.notification) {
                    try {
                        const existingNotifs = JSON.parse(localStorage.getItem('gov_nav_notifications') || '[]');
                        existingNotifs.unshift(data.notification);
                        localStorage.setItem('gov_nav_notifications', JSON.stringify(existingNotifs.slice(0, 50)));
                        window.dispatchEvent(new Event('storage'));
                    } catch (_) {}

                    if (syncChannel) {
                        syncChannel.postMessage({ type: 'NEW_OFFICIAL_BULLETIN', notification: data.notification });
                    }
                }

                // Refresh both schemes and citizen counts
                loadSchemesData();
                loadCitizensData();
            } else {
                alert('Could not save scheme: ' + (data.error || 'Server error'));
            }
        } catch (err) {
            alert('Failed to save scheme: ' + err.message);
        } finally {
            const submitBtn = document.getElementById('save-scheme-submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = '💾 Save & Dispatch Official Gazette';
            }
        }
    };
}

/**
 * Handle Delete Scheme
 */
async function handleDeleteScheme(schemeId, schemeName) {
    if (!confirm(`Are you sure you want to permanently delete '${schemeName}' from the national schemes catalog?`)) {
        return;
    }

    try {
        const res = await fetch('/api/schemes/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: schemeId })
        });
        const data = await res.json();
        if (data.success) {
            allSchemes = allSchemes.filter(s => s.id !== schemeId);
            applySchemeFiltersAndRender();
            updateSchemeKpis(allSchemes);
            if (tabSchemesCount) tabSchemesCount.innerText = allSchemes.length;
            showAdminToast(`🗑️ Scheme '${schemeName}' deleted successfully.`);
        } else {
            alert('Could not delete scheme: ' + (data.message || 'Error'));
        }
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

// ================================================================
// CITIZEN WELFARE DATABASE LOGIC
// ================================================================

/**
 * Fetch all citizen records from /api/users
 */
async function loadCitizensData() {
    if (citizensRecordsContainer) {
        citizensRecordsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #a0aec0;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
                Loading citizen records directly from <code>data/users.json</code>...
            </div>
        `;
    }

    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        allCitizens = data.users || [];
        populateStateFilter(allCitizens);
        applyFiltersAndRender();
        updateCitizenKpis(allCitizens);
        if (tabCitizensCount) tabCitizensCount.innerText = allCitizens.length;
    } catch (err) {
        if (citizensRecordsContainer) {
            citizensRecordsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #fc8181;">
                    Failed to connect to database: ${err.message}
                </div>
            `;
        }
    }
}

/**
 * Update executive citizen KPI cards
 */
function updateCitizenKpis(users) {
    const totalCount = users.length;
    let totalSchemes = 0;

    users.forEach(u => {
        totalSchemes += (u.eligibleSchemes ? u.eligibleSchemes.length : 0);
    });

    const avg = totalCount > 0 ? (totalSchemes / totalCount).toFixed(1) : 0;

    if (statTotalCitizens) statTotalCitizens.innerText = totalCount;
    if (statTotalMatches) statTotalMatches.innerText = totalSchemes;
    if (statAvgSchemes) statAvgSchemes.innerText = avg;
}

/**
 * Populate dynamic state filter dropdown
 */
function populateStateFilter(users) {
    if (!filterState) return;
    const states = new Set();
    users.forEach(u => {
        if (u.profile && u.profile.location) states.add(u.profile.location);
    });

    filterState.innerHTML = '<option value="">All States / UTs</option>';
    Array.from(states).sort().forEach(state => {
        const opt = document.createElement('option');
        opt.value = state;
        opt.innerText = state;
        filterState.appendChild(opt);
    });
}

/**
 * Filter citizen records based on search and dropdown selections
 */
function applyFiltersAndRender() {
    const q = (adminSearch?.value || '').toLowerCase().trim();
    const occ = filterOccupation?.value || '';
    const st = filterState?.value || '';

    filteredCitizens = allCitizens.filter(u => {
        const prof = u.profile || {};
        
        // Search text matching
        const matchQuery = !q || (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (prof.location && prof.location.toLowerCase().includes(q)) ||
            (prof.district && prof.district.toLowerCase().includes(q)) ||
            (prof.occupation && prof.occupation.toLowerCase().includes(q))
        );

        // Occupation matching
        const matchOcc = !occ || (prof.occupation === occ);

        // State matching
        const matchState = !st || (prof.location === st);

        return matchQuery && matchOcc && matchState;
    });

    if (filteredCountDisplay) {
        filteredCountDisplay.innerText = `Showing ${filteredCitizens.length} of ${allCitizens.length} citizens`;
    }
    renderCitizenCards(filteredCitizens);
}

if (adminSearch) adminSearch.oninput = applyFiltersAndRender;
if (filterOccupation) filterOccupation.onchange = applyFiltersAndRender;
if (filterState) filterState.onchange = applyFiltersAndRender;

/**
 * Render individual citizen record cards
 */
function renderCitizenCards(list) {
    if (!citizensRecordsContainer) return;

    if (list.length === 0) {
        citizensRecordsContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: var(--admin-card-bg); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.15);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No citizen records matched your search filters.</h3>
                <p style="color: #a0aec0; font-size: 0.85rem;">Try clearing the search query or filters.</p>
            </div>
        `;
        return;
    }

    citizensRecordsContainer.innerHTML = list.map((u) => {
        const p = u.profile || {};
        const schemes = u.eligibleSchemes || [];
        const initial = (u.name || 'C').charAt(0).toUpperCase();

        return `
            <div class="citizen-card" id="citizen-card-${u.id}">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; background: linear-gradient(135deg, #004b87, #00b4d8); color: white;">
                            ${initial}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <h3 style="margin: 0; font-size: 1.2rem; color: white;">${u.name}</h3>
                                <span style="font-size: 0.75rem; color: #a0aec0; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 6px;">ID: ${u.id}</span>
                            </div>
                            <div style="color: #cbd5e0; font-size: 0.85rem; margin-top: 2px;">
                                📧 ${u.email} • Registered: <strong>${u.createdAt}</strong> • Last Login: <strong>${u.lastLogin || u.createdAt}</strong>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="background: rgba(16, 185, 129, 0.15); color: var(--admin-success); border: 1px solid var(--admin-success); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
                            🎯 ${schemes.length} Matched Schemes
                        </span>
                        <button class="action-btn-sm btn-delete btn-trigger-delete-user" data-user-id="${u.id}" data-user-name="${u.name.replace(/"/g, '&quot;')}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>

                <!-- Demographic Details -->
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;">
                    ${p.occupation ? `<span class="demographic-pill">Occupation: <strong>${p.nlpResult ? p.nlpResult.displayName : p.occupation}</strong></span>` : ''}
                    ${p.nlpResult && p.nlpResult.isSmallScale ? `<span class="demographic-pill" style="border-color: #ed8936; color: #ed8936; background: rgba(237,137,54,0.15);">🏷️ Small Scale Merchant</span>` : ''}
                    ${p.age !== undefined ? `<span class="demographic-pill">Age: <strong>${p.age} yrs</strong></span>` : ''}
                    ${p.gender ? `<span class="demographic-pill">Gender: <strong>${p.gender}</strong></span>` : ''}
                    ${p.income !== undefined ? `<span class="demographic-pill">Annual Income: <strong>₹${p.income.toLocaleString()}</strong></span>` : ''}
                    ${p.location ? `<span class="demographic-pill">State: <strong>${p.location}</strong></span>` : ''}
                    ${p.district ? `<span class="demographic-pill">District: <strong>${p.district}</strong></span>` : ''}
                    ${p.caste ? `<span class="demographic-pill">Category: <strong>${p.caste}</strong></span>` : ''}
                    ${p.area ? `<span class="demographic-pill">Area: <strong>${p.area}</strong></span>` : ''}
                    ${p.disabled ? `<span class="demographic-pill">Disability: <strong>${p.disabled}</strong></span>` : ''}
                </div>

                <!-- Eligible Schemes Expander -->
                <details style="background: rgba(0, 0, 0, 0.25); border-radius: 10px; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.06);">
                    <summary style="cursor: pointer; font-size: 0.88rem; font-weight: 600; color: var(--admin-accent); outline: none;">
                        View ${schemes.length} Eligible Scheme Allocations for ${u.name} ▼
                    </summary>
                    <div style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        ${schemes.length > 0 ? schemes.map((s, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid var(--admin-accent);">
                                <div>
                                    <strong style="color: white; font-size: 0.88rem;">${idx + 1}. ${s.name}</strong>
                                    <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 2px;">
                                        Category: <span style="color: #63b3ed;">${s.category}</span> • Mode: <span>${s.applicationMode || 'Online'}</span>
                                    </div>
                                </div>
                                <a href="${s.officialLink}" target="_blank" rel="noopener noreferrer" style="color: var(--admin-accent); font-size: 0.75rem; text-decoration: none; border: 1px solid var(--admin-accent); padding: 3px 8px; border-radius: 4px;">
                                    Official Portal ↗
                                </a>
                            </div>
                        `).join('') : '<div style="font-size: 0.85rem; color: #a0aec0;">No schemes recorded for this profile yet.</div>'}
                    </div>
                </details>
            </div>
        `;
    }).join('');
}

// Event delegation for citizen delete buttons (100% reliable)
if (citizensRecordsContainer) {
    citizensRecordsContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-trigger-delete-user');
        if (deleteBtn) {
            const userId = deleteBtn.getAttribute('data-user-id');
            const userName = deleteBtn.getAttribute('data-user-name');
            handleDeleteUser(userId, userName);
        }
    });
}

/**
 * Delete a user record from server database
 */
async function handleDeleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to permanently delete citizen record for "${userName}" from data/users.json?`)) {
        return;
    }

    try {
        const res = await fetch('/api/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId })
        });
        const data = await res.json();
        if (data.success) {
            allCitizens = allCitizens.filter(u => u.id !== userId);
            applyFiltersAndRender();
            updateCitizenKpis(allCitizens);
            if (tabCitizensCount) tabCitizensCount.innerText = allCitizens.length;
            showAdminToast(`🗑️ Citizen record for '${userName}' deleted.`);
        } else {
            alert('Could not delete user: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        alert('Delete request failed: ' + err.message);
    }
}

// ================================================================
// EXPORTS: JSON & CSV
// ================================================================

if (adminDownloadJsonBtn) {
    adminDownloadJsonBtn.onclick = () => {
        if (!allCitizens || allCitizens.length === 0) return alert('Database is currently empty.');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allCitizens, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `gov_nav_citizen_database_${Date.now()}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showAdminToast('📥 Citizen database JSON downloaded.');
    };
}

if (adminExportCsvBtn) {
    adminExportCsvBtn.onclick = () => {
        if (!allCitizens || allCitizens.length === 0) return alert('Database is currently empty.');
        
        const headers = ["Citizen ID", "Name", "Email", "Registered At", "Age", "Gender", "Occupation", "Income", "State", "District", "Caste", "Area", "Eligible Schemes Count", "Scheme Names"];
        const rows = allCitizens.map(u => {
            const p = u.profile || {};
            const schemeNames = (u.eligibleSchemes || []).map(s => s.name).join('; ');
            return [
                `"${u.id || ''}"`,
                `"${u.name || ''}"`,
                `"${u.email || ''}"`,
                `"${u.createdAt || ''}"`,
                p.age || '',
                `"${p.gender || ''}"`,
                `"${p.occupation || ''}"`,
                p.income || '',
                `"${p.location || ''}"`,
                `"${p.district || ''}"`,
                `"${p.caste || ''}"`,
                `"${p.area || ''}"`,
                (u.eligibleSchemes || []).length,
                `"${schemeNames.replace(/"/g, '""')}"`
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", encodeURI(csvContent));
        dlAnchor.setAttribute("download", `gov_nav_citizens_report_${Date.now()}.csv`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showAdminToast('📄 Citizen database CSV report generated.');
    };
}

// Initial state load
updateAdminView();
