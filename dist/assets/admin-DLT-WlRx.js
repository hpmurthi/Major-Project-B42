import"./style-6Q5VfEpe.js";const me="gov_nav_admin_session",q={email:"admin@gov.in",validPasswords:["Admin@2026#GovNav","Admin@123!","Admin@2026#"]};let p=[],Z=[],b=[],ee=[];const R=document.getElementById("admin-login-section"),P=document.getElementById("admin-dashboard-section"),fe=document.getElementById("admin-login-form"),T=document.getElementById("admin-auth-error"),pe=document.getElementById("admin-demo-btn"),G=document.getElementById("admin-user-info"),ge=document.getElementById("admin-email-display"),he=document.getElementById("admin-logout-btn"),H=document.getElementById("tab-btn-schemes"),J=document.getElementById("tab-btn-citizens"),ye=document.getElementById("tab-content-schemes"),ve=document.getElementById("tab-content-citizens"),U=document.getElementById("tab-schemes-count"),W=document.getElementById("tab-citizens-count"),be=document.getElementById("stat-total-schemes-count"),Ee=document.getElementById("stat-total-categories-count"),Ae=document.getElementById("stat-central-state-ratio"),O=document.getElementById("scheme-search-input"),B=document.getElementById("filter-scheme-category"),D=document.getElementById("filter-scheme-mode"),M=document.getElementById("filter-scheme-occupation"),N=document.getElementById("filter-scheme-location"),Se=document.getElementById("schemes-filtered-count-display"),A=document.getElementById("schemes-records-container"),we=document.getElementById("stat-total-citizens"),Ce=document.getElementById("stat-total-matches"),Be=document.getElementById("stat-avg-schemes"),j=document.getElementById("admin-search"),_=document.getElementById("filter-occupation"),I=document.getElementById("filter-state"),Ie=document.getElementById("filtered-count-display"),S=document.getElementById("citizens-records-container"),xe=document.getElementById("admin-add-scheme-btn"),$e=document.getElementById("nav-btn-add-scheme"),ke=document.getElementById("btn-quick-new-scheme"),Le=document.getElementById("admin-download-json-btn"),ze=document.getElementById("admin-export-csv-btn"),x=document.getElementById("admin-scheme-modal"),Te=document.getElementById("close-scheme-modal-btn"),Oe=document.getElementById("cancel-scheme-modal-btn"),te=document.getElementById("admin-scheme-form"),De=document.getElementById("modal-scheme-title"),ne=document.getElementById("form-scheme-id"),Ne=document.getElementById("form-scheme-name"),C=document.getElementById("form-scheme-category"),y=document.getElementById("form-scheme-category-other"),w=document.getElementById("category-other-wrapper"),je=document.getElementById("form-scheme-ministry"),g=document.getElementById("form-scheme-mode"),_e=document.getElementById("form-scheme-deadline"),qe=document.getElementById("form-scheme-link"),ie=document.getElementById("form-scheme-desc"),Fe=document.getElementById("form-scheme-benefits"),Re=document.getElementById("form-scheme-steps"),Pe=document.getElementById("form-scheme-docs"),V=document.getElementById("form-scheme-min-age"),K=document.getElementById("form-scheme-max-age"),Q=document.getElementById("form-scheme-gender"),oe=document.getElementById("form-scheme-income"),ae=document.getElementById("form-scheme-location"),se=document.getElementById("form-scheme-disability"),f=document.getElementById("form-scheme-occ-other"),v=document.getElementById("occ-checkbox-other"),ce=document.getElementById("form-bulletin-title"),le=document.getElementById("form-bulletin-type"),re=document.getElementById("form-bulletin-body"),Me=document.getElementById("admin-toast-container");let de=null;try{de=new BroadcastChannel("gov_nav_bulletins")}catch{}function Qe(){return sessionStorage.getItem(me)==="true"}function z(n,t="success"){if(!Me)return;const e=document.createElement("div");e.className="toast-admin-feedback",t==="error"&&(e.style.borderColor="var(--admin-danger)"),e.innerHTML=`
        <span style="font-size: 1.3rem;">${t==="error"?"⚠️":"✅"}</span>
        <span>${n}</span>
    `,Me.appendChild(e),setTimeout(()=>{e.style.transition="opacity 0.3s, transform 0.3s",e.style.opacity="0",e.style.transform="translateY(15px)",setTimeout(()=>e.remove(),350)},4500)}function ue(){Qe()?(R&&(R.style.display="none"),P&&(P.style.display="block"),G&&(G.style.display="flex"),ge&&(ge.innerText=q.email),Je(),We()):(R&&(R.style.display="block"),P&&(P.style.display="none"),G&&(G.style.display="none"))}function Ge(n,t){const e=n&&n.trim().toLowerCase()===q.email.toLowerCase(),i=q.validPasswords.includes(t);e&&i?(sessionStorage.setItem(me,"true"),T&&(T.style.display="none"),ue(),z("Welcome, Administrator. Welfare Governance Console authenticated.")):T&&(T.style.display="block",T.innerText="Invalid official credentials. Accepted passwords: Admin@2026#GovNav or Admin@123!")}fe&&(fe.onsubmit=n=>{n.preventDefault();const t=document.getElementById("admin-email").value,e=document.getElementById("admin-password").value;Ge(t,e)});pe&&(pe.onclick=()=>{const n=document.getElementById("admin-email"),t=document.getElementById("admin-password");n&&(n.value=q.email),t&&(t.value="Admin@2026#GovNav"),Ge(q.email,"Admin@2026#GovNav")});he&&(he.onclick=()=>{sessionStorage.removeItem(me),ue()});function He(n){n==="schemes"?(H.classList.add("active"),J.classList.remove("active"),ye.classList.remove("hidden"),ve.classList.add("hidden")):(J.classList.add("active"),H.classList.remove("active"),ve.classList.remove("hidden"),ye.classList.add("hidden"))}H&&(H.onclick=()=>He("schemes"));J&&(J.onclick=()=>He("citizens"));async function Je(){A&&(A.innerHTML=`
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #a0aec0;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
                Loading official schemes registry...
            </div>
        `);try{b=(await(await fetch("/api/schemes")).json()).schemes||[],Ye(b),$(),Ue(b),U&&(U.innerText=b.length)}catch(n){A&&(A.innerHTML=`
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #fc8181;">
                    Failed to connect to schemes service: ${n.message}
                </div>
            `)}}function Ue(n){const t=n.length,e=new Set(n.map(o=>o.category).filter(Boolean)),i=n.filter(o=>{var u;return!((u=o.eligibility)!=null&&u.location)||o.eligibility.location==="Central"||o.eligibility.location==="All India"}).length,a=t-i;be&&(be.innerText=t),Ee&&(Ee.innerText=e.size),Ae&&(Ae.innerText=`${i} / ${a}`)}function Ye(n){if(!B)return;const t=new Set(n.map(e=>e.category).filter(Boolean));B.innerHTML='<option value="">All Categories</option>',Array.from(t).sort().forEach(e=>{const i=document.createElement("option");i.value=e,i.innerText=e,B.appendChild(i)})}function $(){const n=((O==null?void 0:O.value)||"").toLowerCase().trim(),t=(B==null?void 0:B.value)||"",e=(D==null?void 0:D.value)||"",i=(M==null?void 0:M.value)||"",a=(N==null?void 0:N.value)||"";ee=b.filter(o=>{var s,c,E,k;const u=!n||o.name&&o.name.toLowerCase().includes(n)||o.ministry&&o.ministry.toLowerCase().includes(n)||o.category&&o.category.toLowerCase().includes(n)||o.description&&o.description.toLowerCase().includes(n)||Array.isArray(o.benefits)&&o.benefits.join(" ").toLowerCase().includes(n)||Array.isArray((s=o.eligibility)==null?void 0:s.occupation)&&o.eligibility.occupation.join(" ").toLowerCase().includes(n),h=!t||o.category&&o.category.toLowerCase()===t.toLowerCase();let r=!0;if(e){const l=(o.applicationMode||"").toLowerCase();e==="Both"?r=l.includes("both")||l.includes("online")&&l.includes("offline"):e==="Online"?r=l.includes("online")||l.includes("both"):e==="Offline"?r=l.includes("offline")||l.includes("both")||l.includes("csc")||l.includes("bank")||l.includes("panchayat")||l.includes("post"):e==="CSC Center"?r=l.includes("csc")||l.includes("center"):e==="Bank Branch"?r=l.includes("bank"):e==="Gram Panchayat"?r=l.includes("panchayat")||l.includes("municipal"):e==="Post Office"?r=l.includes("post"):e==="Mobile App"?r=l.includes("app")||l.includes("umang"):e==="Other"&&(r=l.includes("other")||!l.includes("online")&&!l.includes("offline")&&!l.includes("both"))}let d=!0;if(i){const l=(((c=o.eligibility)==null?void 0:c.occupation)||[]).map(L=>L.toLowerCase());if(l.includes("all")||l.includes("any"))d=!0;else if(i==="Other"){const L=["farmer","student","entrepreneur","street vendor","artisan","daily wager","employed","self-employed","unemployed","homemaker","healthcare worker","sanitation worker","senior citizen","ex-serviceman"];d=l.includes("other")||l.some(Ke=>!L.includes(Ke))}else d=l.includes(i.toLowerCase())||l.some(L=>L.includes(i.toLowerCase())||i.toLowerCase().includes(L))}let m=!0;return a==="Central"?m=!((E=o.eligibility)!=null&&E.location)||o.eligibility.location==="Central"||o.eligibility.location==="All India":a&&(m=((k=o.eligibility)==null?void 0:k.location)===a),u&&h&&r&&d&&m}),Se&&(Se.innerText=`Showing ${ee.length} of ${b.length} schemes`),Xe(ee)}O&&(O.oninput=$);B&&(B.onchange=$);D&&(D.onchange=$);M&&(M.onchange=$);N&&(N.onchange=$);function Xe(n){if(A){if(n.length===0){A.innerHTML=`
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: var(--admin-card-bg); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.15);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No schemes matched your search criteria.</h3>
                <p style="color: #a0aec0; font-size: 0.85rem; margin-top: 0.5rem;">Try modifying your keyword, mode or occupation filter or click "Formulate New Scheme".</p>
            </div>
        `;return}A.innerHTML=n.map(t=>{const e=t.eligibility||{},a=!e.location||e.location==="Central"||e.location==="All India"?"Pan-India / Central":e.location,o=Array.isArray(e.occupation)&&e.occupation.length>0?e.occupation.join(", "):"All Occupations",u=e.minAge!==void 0||e.maxAge!==void 0?`${e.minAge??0} - ${e.maxAge??125} yrs`:"Any Age",h=Array.isArray(t.benefits)?t.benefits:[t.benefits||t.description],r=t.applicationMode||"Online";let d="mode-online",m="🌐";const s=r.toLowerCase();return s.includes("both")||s.includes("online")&&s.includes("offline")?(d="mode-both",m="🔄"):s.includes("offline")?(d="mode-offline",m="🏢"):s.includes("csc")||s.includes("center")?(d="mode-csc",m="📍"):s.includes("bank")?(d="mode-offline",m="🏦"):s.includes("panchayat")||s.includes("municipal")?(d="mode-csc",m="🏛"):s.includes("post")?(d="mode-offline",m="📮"):s.includes("app")?(d="mode-online",m="📱"):(d="mode-csc",m="📝"),`
            <div class="scheme-admin-card" data-scheme-id="${t.id}">
                <div>
                    <div class="scheme-header-row">
                        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                            <span class="scheme-tag cat">${t.category||"General"}</span>
                            <span class="scheme-tag ${d}">${m} ${r}</span>
                            <span class="scheme-tag central">${a}</span>
                        </div>
                        <span style="font-size: 0.72rem; color: #718096;">ID: ${t.id}</span>
                    </div>

                    <h3 style="font-size: 1.15rem; font-weight: 700; color: white; margin: 0 0 0.4rem 0; line-height: 1.35;">
                        ${t.name}
                    </h3>
                    <div style="font-size: 0.78rem; color: #a0aec0; margin-bottom: 0.75rem;">
                        🏛 ${t.ministry||"Nodal Ministry / Department"}
                    </div>

                    <div style="font-size: 0.82rem; color: #cbd5e0; line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${t.description||h[0]||""}
                    </div>

                    <!-- Benefits Highlight -->
                    <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 0.75rem; border-left: 3px solid var(--admin-accent); margin-bottom: 1rem;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; color: #718096; font-weight: 700; margin-bottom: 0.3rem;">Key Provisions:</div>
                        <div style="font-size: 0.8rem; color: #68d391; font-weight: 600;">
                            ${h.slice(0,2).map(c=>`• ${c}`).join("<br>")}
                        </div>
                    </div>

                    <!-- Eligibility Snapshot -->
                    <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem;">
                        <span class="demographic-pill">🎯 ${o}</span>
                        <span class="demographic-pill">🎂 ${u}</span>
                        ${e.maxIncome?`<span class="demographic-pill">💰 ≤ ₹${e.maxIncome.toLocaleString()}</span>`:""}
                    </div>
                </div>

                <!-- Action Toolbar -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="action-btn-sm btn-edit btn-trigger-edit-scheme" data-scheme-id="${t.id}">
                            ✏️ Edit & Revise
                        </button>
                        <button class="action-btn-sm btn-delete btn-trigger-delete-scheme" data-scheme-id="${t.id}" data-scheme-name="${t.name.replace(/"/g,"&quot;")}">
                            🗑️
                        </button>
                    </div>

                    <a href="${t.officialLink}" target="_blank" rel="noopener noreferrer" style="color: var(--admin-accent); font-size: 0.78rem; text-decoration: none; border: 1px solid var(--admin-accent); padding: 5px 10px; border-radius: 6px; font-weight: 600;">
                        Official Portal ↗
                    </a>
                </div>
            </div>
        `}).join("")}}A&&A.addEventListener("click",n=>{const t=n.target.closest(".btn-trigger-edit-scheme");if(t){const i=t.getAttribute("data-scheme-id");Y(i);return}const e=n.target.closest(".btn-trigger-delete-scheme");if(e){const i=e.getAttribute("data-scheme-id"),a=e.getAttribute("data-scheme-name");Ze(i,a);return}});C&&C.addEventListener("change",()=>{if(w){const n=C.value==="Other";w.style.display=n?"block":"none",n&&y&&y.focus()}});document.addEventListener("click",n=>{const t=n.target.closest(".quick-occ-pill");if(t){const e=t.getAttribute("data-val");if(v&&(v.checked=!0),f){const a=f.value.trim();a?a.toLowerCase().includes(e.toLowerCase())||(f.value=`${a}, ${e}`):f.value=e,f.focus()}const i=document.querySelector('input[name="form-occ"][value="All"]');i&&(i.checked=!1)}});document.querySelectorAll('input[name="form-occ"]').forEach(n=>{n.addEventListener("change",()=>{const t=document.querySelector('input[name="form-occ"][value="All"]');n.value==="All"?n.checked&&(document.querySelectorAll('input[name="form-occ"]').forEach(e=>{e!==n&&(e.checked=!1)}),f&&(f.value="")):(n.checked&&t&&(t.checked=!1),!Array.from(document.querySelectorAll('input[name="form-occ"]')).some(i=>i.checked)&&t&&(t.checked=!0))})});function Y(n=null){if(!x)return;te.reset();const t=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});if(n){const e=b.find(c=>c.id===n);if(!e)return;if(De.innerText=`Edit & Revise: ${e.name}`,ne.value=e.id,Ne.value=e.name||"",Array.from(C.options).map(c=>c.value).includes(e.category)?(C.value=e.category,w&&(w.style.display="none"),y&&(y.value="")):(C.value="Other",w&&(w.style.display="block"),y&&(y.value=e.category||"")),je.value=e.ministry||"",Array.from(g.options).map(c=>c.value).includes(e.applicationMode))g.value=e.applicationMode;else{const c=(e.applicationMode||"").toLowerCase();c.includes("both")?g.value="Both":c.includes("online")?g.value="Online":c.includes("offline")?g.value="Offline":c.includes("csc")||c.includes("center")?g.value="CSC Center":c.includes("bank")?g.value="Bank Branch":c.includes("panchayat")||c.includes("municipal")?g.value="Gram Panchayat / Municipal Office":c.includes("post")?g.value="Post Office":c.includes("app")?g.value="Mobile App":g.value="Other"}_e.value=e.deadline||"",qe.value=e.officialLink||"",ie.value=e.description||"";const o=Array.isArray(e.benefits)?e.benefits:[e.benefits||""];Fe.value=o.join(`
`);const u=Array.isArray(e.applicationSteps)?e.applicationSteps:[e.applicationSteps||""];Re.value=u.join(`
`);const h=Array.isArray(e.requiredDocuments)?e.requiredDocuments:[e.requiredDocuments||""];Pe.value=h.join(", ");const r=e.eligibility||{};V.value=r.minAge!==void 0?r.minAge:0,K.value=r.maxAge!==void 0?r.maxAge:125,Q.value=r.gender&&r.gender.length===1?r.gender[0]:"Any",oe.value=r.maxIncome||"",ae.value=r.location||"Central",se.value=r.disabledOnly?"true":"false";const d=r.occupation||["All"],m=["All","Farmer","Student","Entrepreneur","Street Vendor","Artisan","Daily Wager","Employed","Self-Employed","Unemployed","Homemaker","Healthcare Worker","Sanitation Worker","Senior Citizen","Ex-Serviceman"],s=[];document.querySelectorAll('input[name="form-occ"]').forEach(c=>{c.value==="Other"?c.checked=!1:c.checked=d.includes(c.value)}),d.forEach(c=>{!m.includes(c)&&c!=="Other"&&s.push(c)}),d.includes("Other")||s.length>0?(v&&(v.checked=!0),f&&(f.value=s.join(", "))):(v&&(v.checked=!1),f&&(f.value="")),ce.value=`📋 Official Scheme Revision: ${e.name}`,le.value="benefit_update",re.value=`Official Welfare Gazette (${t}): The guidelines, benefits, and operational provisions for '${e.name}' have been revised by the nodal department. Primary benefits: ${o.slice(0,2).join("; ")}. Eligible citizens are advised to check guidelines and apply on the official portal.`}else De.innerText="Formulate New Government Scheme",ne.value="",C.value="Agriculture",w&&(w.style.display="none"),y&&(y.value=""),g.value="Both",V.value=0,K.value=125,Q.value="Any",ae.value="Central",se.value="false",document.querySelectorAll('input[name="form-occ"]').forEach(e=>{e.checked=e.value==="All"}),v&&(v.checked=!1),f&&(f.value=""),ce.value="",le.value="announcement",re.value="";x.classList.remove("hidden")}function X(){x&&x.classList.add("hidden")}Te&&(Te.onclick=X);Oe&&(Oe.onclick=X);xe&&(xe.onclick=()=>Y(null));$e&&($e.onclick=()=>Y(null));ke&&(ke.onclick=()=>Y(null));x&&(x.onclick=n=>{n.target===x&&X()});te&&(te.onsubmit=async n=>{var d,m;n.preventDefault();const t=[];document.querySelectorAll('input[name="form-occ"]:checked').forEach(s=>{s.value!=="Other"&&t.push(s.value)});const e=((d=f==null?void 0:f.value)==null?void 0:d.trim())||"";(v!=null&&v.checked||e)&&(e?e.split(/,|\n/).map(c=>c.trim()).filter(Boolean).forEach(c=>{t.includes(c)||t.push(c)}):t.includes("Other")||t.push("Other"));let i=C.value;i==="Other"&&(i=((m=y==null?void 0:y.value)==null?void 0:m.trim())||"General Welfare");const a=Fe.value.split(`
`).map(s=>s.trim()).filter(Boolean),o=Re.value.split(`
`).map(s=>s.trim()).filter(Boolean),u=Pe.value.split(/,|\n/).map(s=>s.trim()).filter(Boolean),h={id:ne.value||void 0,name:Ne.value.trim(),category:i,ministry:je.value.trim()||"Ministry of Social Justice and Empowerment",applicationMode:g.value,deadline:_e.value.trim()||"Active Enrollment",officialLink:qe.value.trim(),description:ie.value.trim(),benefits:a.length>0?a:[ie.value.trim()],applicationSteps:o,requiredDocuments:u,eligibility:{minAge:V.value?Number(V.value):0,maxAge:K.value?Number(K.value):125,gender:Q.value==="Any"?["Male","Female","Other"]:[Q.value],maxIncome:oe.value?Number(oe.value):void 0,location:ae.value||"Central",occupation:t.length>0?t:["All"],disabledOnly:se.value==="true"}},r={title:ce.value.trim(),type:le.value,summary:re.value.trim()};try{const s=document.getElementById("save-scheme-submit-btn");s&&(s.disabled=!0,s.innerText="⏳ Publishing to Registry...");const E=await(await fetch("/api/schemes/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scheme:h,bulletin:r})})).json();if(E.success){if(X(),z(`✅ Scheme '${E.scheme.name}' published! Official Gazette notification dispatched to citizen profiles.`),E.notification){try{const k=JSON.parse(localStorage.getItem("gov_nav_notifications")||"[]");k.unshift(E.notification),localStorage.setItem("gov_nav_notifications",JSON.stringify(k.slice(0,50))),window.dispatchEvent(new Event("storage"))}catch{}de&&de.postMessage({type:"NEW_OFFICIAL_BULLETIN",notification:E.notification})}Je(),We()}else alert("Could not save scheme: "+(E.error||"Server error"))}catch(s){alert("Failed to save scheme: "+s.message)}finally{const s=document.getElementById("save-scheme-submit-btn");s&&(s.disabled=!1,s.innerText="💾 Save & Dispatch Official Gazette")}});async function Ze(n,t){if(confirm(`Are you sure you want to permanently delete '${t}' from the national schemes catalog?`))try{const i=await(await fetch("/api/schemes/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:n})})).json();i.success?(b=b.filter(a=>a.id!==n),$(),Ue(b),U&&(U.innerText=b.length),z(`🗑️ Scheme '${t}' deleted successfully.`)):alert("Could not delete scheme: "+(i.message||"Error"))}catch(e){alert("Delete failed: "+e.message)}}async function We(){S&&(S.innerHTML=`
            <div style="text-align: center; padding: 3rem; color: #a0aec0;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
                Loading citizen records directly from <code>data/users.json</code>...
            </div>
        `);try{p=(await(await fetch("/api/users")).json()).users||[],et(p),F(),Ve(p),W&&(W.innerText=p.length)}catch(n){S&&(S.innerHTML=`
                <div style="text-align: center; padding: 3rem; color: #fc8181;">
                    Failed to connect to database: ${n.message}
                </div>
            `)}}function Ve(n){const t=n.length;let e=0;n.forEach(a=>{e+=a.eligibleSchemes?a.eligibleSchemes.length:0});const i=t>0?(e/t).toFixed(1):0;we&&(we.innerText=t),Ce&&(Ce.innerText=e),Be&&(Be.innerText=i)}function et(n){if(!I)return;const t=new Set;n.forEach(e=>{e.profile&&e.profile.location&&t.add(e.profile.location)}),I.innerHTML='<option value="">All States / UTs</option>',Array.from(t).sort().forEach(e=>{const i=document.createElement("option");i.value=e,i.innerText=e,I.appendChild(i)})}function F(){const n=((j==null?void 0:j.value)||"").toLowerCase().trim(),t=(_==null?void 0:_.value)||"",e=(I==null?void 0:I.value)||"";Z=p.filter(i=>{const a=i.profile||{},o=!n||i.name&&i.name.toLowerCase().includes(n)||i.email&&i.email.toLowerCase().includes(n)||a.location&&a.location.toLowerCase().includes(n)||a.district&&a.district.toLowerCase().includes(n)||a.occupation&&a.occupation.toLowerCase().includes(n),u=!t||a.occupation===t,h=!e||a.location===e;return o&&u&&h}),Ie&&(Ie.innerText=`Showing ${Z.length} of ${p.length} citizens`),tt(Z)}j&&(j.oninput=F);_&&(_.onchange=F);I&&(I.onchange=F);function tt(n){if(S){if(n.length===0){S.innerHTML=`
            <div style="text-align: center; padding: 4rem; background: var(--admin-card-bg); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.15);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No citizen records matched your search filters.</h3>
                <p style="color: #a0aec0; font-size: 0.85rem;">Try clearing the search query or filters.</p>
            </div>
        `;return}S.innerHTML=n.map(t=>{const e=t.profile||{},i=t.eligibleSchemes||[],a=(t.name||"C").charAt(0).toUpperCase();return`
            <div class="citizen-card" id="citizen-card-${t.id}">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; background: linear-gradient(135deg, #004b87, #00b4d8); color: white;">
                            ${a}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <h3 style="margin: 0; font-size: 1.2rem; color: white;">${t.name}</h3>
                                <span style="font-size: 0.75rem; color: #a0aec0; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 6px;">ID: ${t.id}</span>
                            </div>
                            <div style="color: #cbd5e0; font-size: 0.85rem; margin-top: 2px;">
                                📧 ${t.email} • Registered: <strong>${t.createdAt}</strong> • Last Login: <strong>${t.lastLogin||t.createdAt}</strong>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="background: rgba(16, 185, 129, 0.15); color: var(--admin-success); border: 1px solid var(--admin-success); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
                            🎯 ${i.length} Matched Schemes
                        </span>
                        <button class="action-btn-sm btn-delete btn-trigger-delete-user" data-user-id="${t.id}" data-user-name="${t.name.replace(/"/g,"&quot;")}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>

                <!-- Demographic Details -->
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;">
                    ${e.occupation?`<span class="demographic-pill">Occupation: <strong>${e.nlpResult?e.nlpResult.displayName:e.occupation}</strong></span>`:""}
                    ${e.nlpResult&&e.nlpResult.isSmallScale?'<span class="demographic-pill" style="border-color: #ed8936; color: #ed8936; background: rgba(237,137,54,0.15);">🏷️ Small Scale Merchant</span>':""}
                    ${e.age!==void 0?`<span class="demographic-pill">Age: <strong>${e.age} yrs</strong></span>`:""}
                    ${e.gender?`<span class="demographic-pill">Gender: <strong>${e.gender}</strong></span>`:""}
                    ${e.income!==void 0?`<span class="demographic-pill">Annual Income: <strong>₹${e.income.toLocaleString()}</strong></span>`:""}
                    ${e.location?`<span class="demographic-pill">State: <strong>${e.location}</strong></span>`:""}
                    ${e.district?`<span class="demographic-pill">District: <strong>${e.district}</strong></span>`:""}
                    ${e.caste?`<span class="demographic-pill">Category: <strong>${e.caste}</strong></span>`:""}
                    ${e.area?`<span class="demographic-pill">Area: <strong>${e.area}</strong></span>`:""}
                    ${e.disabled?`<span class="demographic-pill">Disability: <strong>${e.disabled}</strong></span>`:""}
                </div>

                <!-- Eligible Schemes Expander -->
                <details style="background: rgba(0, 0, 0, 0.25); border-radius: 10px; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.06);">
                    <summary style="cursor: pointer; font-size: 0.88rem; font-weight: 600; color: var(--admin-accent); outline: none;">
                        View ${i.length} Eligible Scheme Allocations for ${t.name} ▼
                    </summary>
                    <div style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        ${i.length>0?i.map((o,u)=>`
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid var(--admin-accent);">
                                <div>
                                    <strong style="color: white; font-size: 0.88rem;">${u+1}. ${o.name}</strong>
                                    <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 2px;">
                                        Category: <span style="color: #63b3ed;">${o.category}</span> • Mode: <span>${o.applicationMode||"Online"}</span>
                                    </div>
                                </div>
                                <a href="${o.officialLink}" target="_blank" rel="noopener noreferrer" style="color: var(--admin-accent); font-size: 0.75rem; text-decoration: none; border: 1px solid var(--admin-accent); padding: 3px 8px; border-radius: 4px;">
                                    Official Portal ↗
                                </a>
                            </div>
                        `).join(""):'<div style="font-size: 0.85rem; color: #a0aec0;">No schemes recorded for this profile yet.</div>'}
                    </div>
                </details>
            </div>
        `}).join("")}}S&&S.addEventListener("click",n=>{const t=n.target.closest(".btn-trigger-delete-user");if(t){const e=t.getAttribute("data-user-id"),i=t.getAttribute("data-user-name");nt(e,i)}});async function nt(n,t){if(confirm(`Are you sure you want to permanently delete citizen record for "${t}" from data/users.json?`))try{const i=await(await fetch("/api/users/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:n})})).json();i.success?(p=p.filter(a=>a.id!==n),F(),Ve(p),W&&(W.innerText=p.length),z(`🗑️ Citizen record for '${t}' deleted.`)):alert("Could not delete user: "+(i.message||"Unknown error"))}catch(e){alert("Delete request failed: "+e.message)}}Le&&(Le.onclick=()=>{if(!p||p.length===0)return alert("Database is currently empty.");const n="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(p,null,2)),t=document.createElement("a");t.setAttribute("href",n),t.setAttribute("download",`gov_nav_citizen_database_${Date.now()}.json`),document.body.appendChild(t),t.click(),t.remove(),z("📥 Citizen database JSON downloaded.")});ze&&(ze.onclick=()=>{if(!p||p.length===0)return alert("Database is currently empty.");const n=["Citizen ID","Name","Email","Registered At","Age","Gender","Occupation","Income","State","District","Caste","Area","Eligible Schemes Count","Scheme Names"],t=p.map(a=>{const o=a.profile||{},u=(a.eligibleSchemes||[]).map(h=>h.name).join("; ");return[`"${a.id||""}"`,`"${a.name||""}"`,`"${a.email||""}"`,`"${a.createdAt||""}"`,o.age||"",`"${o.gender||""}"`,`"${o.occupation||""}"`,o.income||"",`"${o.location||""}"`,`"${o.district||""}"`,`"${o.caste||""}"`,`"${o.area||""}"`,(a.eligibleSchemes||[]).length,`"${u.replace(/"/g,'""')}"`]}),e="data:text/csv;charset=utf-8,"+[n.join(","),...t.map(a=>a.join(","))].join(`
`),i=document.createElement("a");i.setAttribute("href",encodeURI(e)),i.setAttribute("download",`gov_nav_citizens_report_${Date.now()}.csv`),document.body.appendChild(i),i.click(),i.remove(),z("📄 Citizen database CSV report generated.")});ue();
