import { Chatbot } from './js/chatbot.js';
import { matchSchemes, searchByKeyword } from './js/engine.js';
import { t, setLang, currentLang } from './js/i18n.js';

let schemes = [];
fetch('/data/schemes.json')
    .then(r => r.json())
    .then(data => {
        schemes = data;
        console.log(`Successfully loaded ${schemes.length} schemes into the system.`);
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
const resetBtn = document.getElementById('reset-profile');

// Modal Elements
const schemeModal = document.getElementById('scheme-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

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

const switchView = (viewName) => {
    // Hide all
    chatView.classList.replace('view-active', 'view-hidden');
    dashboardView.classList.replace('view-active', 'view-hidden');
    profileView.classList.replace('view-active', 'view-hidden');
    
    navDiscovery.classList.remove('active');
    navDashboard.classList.remove('active');
    navProfile.classList.remove('active');

    if (viewName === 'discovery') {
        chatView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "Assistant Discovery";
        navDiscovery.classList.add('active');
    } else if (viewName === 'dashboard') {
        dashboardView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "Government Dashboard";
        navDashboard.classList.add('active');
    } else if (viewName === 'profile') {
        profileView.classList.replace('view-hidden', 'view-active');
        if (viewTitle) viewTitle.innerText = "My Profile";
        navProfile.classList.add('active');
        renderProfilePage();
    }
};

navDiscovery.onclick = () => switchView('discovery');
navDashboard.onclick = () => switchView('dashboard');
navProfile.onclick = () => switchView('profile');

const renderProfilePage = () => {
    if (!userProfile) {
        profileDetailsFull.innerHTML = "<p>No profile found. Please complete the discovery phase.</p>";
        return;
    }
    profileDetailsFull.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: left;">
            <div><strong>Gender:</strong></div><div>${userProfile.gender}</div>
            <div><strong>Age:</strong></div><div>${userProfile.age}</div>
            <div><strong>Occupation:</strong></div><div>${userProfile.occupation}</div>
            <div><strong>Annual Income:</strong></div><div>₹${userProfile.income.toLocaleString()}</div>
            <div><strong>State/UT:</strong></div><div>${userProfile.location}</div>
            <div><strong>District/City:</strong></div><div>${userProfile.district}</div>
            <div><strong>Area:</strong></div><div>${userProfile.area}</div>
            <div><strong>Category/Caste:</strong></div><div>${userProfile.caste}</div>
            <div><strong>Disabled:</strong></div><div>${userProfile.disabled}</div>
        </div>
    `;
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
    const matched = matchSchemes(profile, schemes);
    
    // Update Badge & Dashboard Stats
    userBadge.innerText = profile.occupation || profile.gender;
    schemesCount.innerText = matched.length;
    summaryContent.innerHTML = `
        <p><strong>Age:</strong> ${profile.age} | <strong>Gender:</strong> ${profile.gender}</p>
        <p><strong>Location:</strong> ${profile.district}, ${profile.location} (${profile.area})</p>
        <p><strong>Income:</strong> ₹${profile.income.toLocaleString()}</p>
        <p><strong>Category:</strong> ${profile.caste}</p>
    `;

    // Render Dashboard Results
    currentMatches = matched;
    renderMatches(matched);

    // Auto-switch to Dashboard
    setTimeout(() => switchView('dashboard'), 800);
};

const openSchemeModal = (scheme) => {
    modalBody.innerHTML = `
        <div class="modal-category">${scheme.category}</div>
        <h2>${scheme.name}</h2>
        <p style="font-size: 1.1rem; color: #cbd5e0; line-height: 1.6;">${scheme.description}</p>
        
        <div class="detail-section">
            <h4>Key Benefits</h4>
            <ul>${scheme.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>

        <div class="detail-section">
            <h4>${t('req_docs')}</h4>
            <ul style="color: #cbd5e0; padding-left: 1.2rem;">
                ${(scheme.requiredDocuments || ["Aadhaar Card", "Passport Photo"]).map(b => `<li style="margin-bottom: 0.5rem">${b}</li>`).join('')}
            </ul>
        </div>

        <div class="detail-section">
            <h4>Application Steps</h4>
            <ol style="color: #cbd5e0; padding-left: 1.2rem;">
                ${scheme.applicationSteps.map(step => `<li style="margin-bottom: 0.5rem">${step}</li>`).join('')}
            </ol>
        </div>

        ${(() => {
            if (scheme.applicationMode === 'Offline' || scheme.applicationMode === 'Both') {
                const stepsStr = scheme.applicationSteps.join(" ").toLowerCase();
                let targetFacility = "Government Office";
                if (stepsStr.includes('bank')) targetFacility = "Bank";
                else if (stepsStr.includes('panchayat')) targetFacility = "Gram Panchayat";
                else if (stepsStr.includes('csc')) targetFacility = "Common Service Center CSC";
                else if (stepsStr.includes('anganwadi')) targetFacility = "Anganwadi Center";
                else if (stepsStr.includes('post office')) targetFacility = "Post Office";
                
                const searchQuery = encodeURIComponent(`Nearest ${targetFacility} in ${userProfile?.district || ''} ${userProfile?.location || ''}`);
                return `
                    <div class="detail-section">
                        <h4>Offline Action Required 🗺️</h4>
                        <p style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #a0aec0;">We configured an interactive map pointing to centers near you:</p>
                        <div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1rem;">
                            <iframe width="100%" height="100%" style="border:0;" loading="lazy" allowfullscreen 
                                src="https://maps.google.com/maps?q=${searchQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed">
                            </iframe>
                        </div>
                    </div>
                `;
            }
            return '';
        })()}

        <button id="external-link-btn" class="apply-btn" style="background: ${scheme.applicationMode === 'Offline' ? '#4a5568' : 'var(--primary)'}; border: none; font-size: 1rem; width: 100%; text-align: center; cursor: pointer;">
            ${scheme.applicationMode === 'Offline' ? 'Download Forms / Instructions' : (scheme.applicationMode === 'Both' ? 'Apply Online / Instructions' : 'Visit Official Portal')}
        </button>
    `;
    schemeModal.classList.remove('hidden-modal');

    document.getElementById('external-link-btn').onclick = () => {
        try {
            const domain = new URL(scheme.officialLink).hostname;
            const userConsent = confirm(`GovNavigator Redirect Notice\n\nYou are leaving GovNavigator AI.\nYou are now being redirected to the external government portal:\n\n🌐 ${domain}\n\nDo you wish to continue and open this page?`);
            if (userConsent) {
                window.open(scheme.officialLink, '_blank');
            }
        } catch (e) {
            // Fallback if URL parsing fails
            if (confirm(`You are leaving GovNavigator to visit an external site. Do you wish to continue?\n\nLink: ${scheme.officialLink}`)) {
                 window.open(scheme.officialLink, '_blank');
            }
        }
    };
};

closeModal.onclick = () => schemeModal.classList.add('hidden-modal');
window.onclick = (e) => { if (e.target === schemeModal) schemeModal.classList.add('hidden-modal'); };

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
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem">
                        <div class="card-category" style="margin-bottom:0;">${s.category}</div>
                        <div style="font-size:0.7rem; padding: 3px 8px; border-radius: 8px; background: ${s.applicationMode==='Online'?'rgba(72,187,120,0.1)':'rgba(237,137,54,0.1)'}; color: ${s.applicationMode==='Online'?'#48bb78':'#ed8936'}; border: 1px solid currentColor;">
                            ${s.applicationMode === 'Both' ? '🌐 Online + 🏢 Offline' : (s.applicationMode === 'Online' ? '🌐 Online' : '🏢 Offline')}
                        </div>
                    </div>
                    <h3>${s.name}</h3>
                    <p>${s.description}</p>
                </div>
                <button class="view-details-btn">View Details</button>
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

const bot = new Chatbot(handleComplete);

const updateUI = (question) => {
    if (question.done) {
        appendMessage("Analysis complete! Building your custom scheme dashboard...", 'bot');
        const profile = bot.profile;
        localStorage.setItem('gov_nav_profile', JSON.stringify(profile));
        userProfile = profile;
        setTimeout(() => switchView('dashboard'), 1000);
        bot.onComplete(profile);
        return;
    }

    appendMessage(question.text, 'bot');
    interactionArea.innerHTML = "";

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
        input.type = "text";
        input.className = 'option-btn';
        input.style.flex = "1";
        input.style.margin = "0";
        input.placeholder = "Type or Speak...";
        
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
        btn.innerText = t('next');
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
        }
        wrapper.appendChild(input);
        wrapper.appendChild(micBtn);
        interactionArea.appendChild(wrapper);
        interactionArea.appendChild(btn);
        input.focus();
    }
};

// Initial State Check
if (userProfile) {
    handleComplete(userProfile);
} else {
    updateUI(bot.getNext());
}
