// vite.config.js
import { defineConfig } from "file:///C:/Users/Hp/Downloads/infathon%20zip%20(2)/infathon/node_modules/vite/dist/node/index.js";

// scripts/live_scraper.js
import axios from "file:///C:/Users/Hp/Downloads/infathon%20zip%20(2)/infathon/node_modules/axios/index.js";
import https from "https";
import crypto from "crypto";
import * as cheerio from "file:///C:/Users/Hp/Downloads/infathon%20zip%20(2)/infathon/node_modules/cheerio/dist/esm/index.js";
var httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
  // Essential for legacy NIC / state government SSL servers
});
var liveCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 5 * 60 * 1e3;
async function scrapeLiveGovScheme(url, schemeName = "", forceRefresh = false) {
  if (!url || typeof url !== "string") {
    return { success: false, errorMessage: "Invalid or missing URL." };
  }
  const cacheKey = url.trim().toLowerCase();
  const cached = liveCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[LiveScraper] Returning cached live data for ${url}`);
    return { ...cached.data, fromCache: true };
  }
  const startTime = Date.now();
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch (_) {
    domain = url;
  }
  try {
    console.log(`[LiveScraper] Contacting official portal in real-time: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-IN,en-GB,en;q=0.9,hi;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      httpsAgent,
      timeout: 12e3,
      maxRedirects: 5
    });
    const latency = Date.now() - startTime;
    const html = response.data;
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, iframe").remove();
    const title = $("title").text().replace(/\s+/g, " ").trim();
    const metaDesc = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
    const announcements = [];
    $("marquee, .marquee, .alert, .notification, .ticker, .announcement, .latest-update, .news-ticker, .news, .updates").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 20 && text.length < 300 && !announcements.includes(text)) {
        announcements.push(text);
      }
    });
    const liveEligibility = [];
    const eligibilityKeywords = ["eligib", "who can apply", "criteria", "patrata", "guidelines", "beneficiar"];
    $("h1, h2, h3, h4, h5, strong, b, dt").each((_, el) => {
      const headingText = $(el).text().trim().toLowerCase();
      if (eligibilityKeywords.some((kw) => headingText.includes(kw))) {
        const nextUl = $(el).next("ul, ol");
        if (nextUl.length) {
          nextUl.find("li").each((_2, li) => {
            const item = $(li).text().replace(/\s+/g, " ").trim();
            if (item.length > 10 && item.length < 250 && !liveEligibility.includes(item)) {
              liveEligibility.push(item);
            }
          });
        } else {
          const nextP = $(el).next("p, dd");
          if (nextP.length) {
            const pText = nextP.text().replace(/\s+/g, " ").trim();
            if (pText.length > 15 && pText.length < 350 && !liveEligibility.includes(pText)) {
              liveEligibility.push(pText);
            }
          }
        }
      }
    });
    const liveBenefits = [];
    $("p, li").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if ((text.includes("\u20B9") || text.includes("Rs.") || text.includes("Rs ") || /subsid/i.test(text) || /financial assistance/i.test(text) || /incentive/i.test(text)) && text.length > 15 && text.length < 250 && !liveBenefits.includes(text)) {
        if (liveBenefits.length < 5) liveBenefits.push(text);
      }
    });
    const helplines = [];
    const bodyText = $("body").text().replace(/\s+/g, " ");
    const phoneRegex = /(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|011[-\s]?[0-9]{7,8}|\+91[-\s]?[0-9]{10}|(?:helpline|toll free|call center)[:\s]+[0-9\-\s]{8,15})/gi;
    const phoneMatches = bodyText.match(phoneRegex);
    if (phoneMatches) {
      phoneMatches.slice(0, 3).forEach((m) => {
        const cleaned = m.trim();
        if (!helplines.includes(cleaned)) helplines.push(cleaned);
      });
    }
    const docKeywords = [
      "Aadhaar Card",
      "Income Certificate",
      "Caste Certificate",
      "Ration Card",
      "Bank Account",
      "Land Records (RTC)",
      "Passport Photo",
      "PAN Card",
      "Voter ID",
      "Domicile Certificate",
      "Birth Certificate"
    ];
    const detectedDocuments = [];
    docKeywords.forEach((doc) => {
      const baseTerm = doc.split(" ")[0];
      const regex = new RegExp(`\\b${baseTerm}\\b`, "i");
      if (regex.test(bodyText) && !detectedDocuments.includes(doc)) {
        detectedDocuments.push(doc);
      }
    });
    const liveData = {
      success: true,
      source: "live_gov_portal",
      url,
      domain,
      pageTitle: title || schemeName,
      metaDescription: metaDesc,
      latencyMs: latency,
      httpStatus: response.status,
      isLive: true,
      fetchedAt: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      announcements: announcements.slice(0, 3),
      liveEligibility: liveEligibility.slice(0, 5),
      liveBenefits: liveBenefits.slice(0, 4),
      helplines,
      detectedDocuments
    };
    liveCache.set(cacheKey, { timestamp: Date.now(), data: liveData });
    return liveData;
  } catch (err) {
    console.error(`[LiveScraper Error] Could not reach ${url}:`, err.message);
    return {
      success: false,
      source: "live_gov_portal_error",
      url,
      domain,
      pageTitle: schemeName,
      latencyMs: Date.now() - startTime,
      httpStatus: err.response?.status || 503,
      isLive: false,
      errorMessage: err.message.includes("timeout") ? "Official portal response timed out." : err.message,
      fetchedAt: (/* @__PURE__ */ new Date()).toLocaleTimeString()
    };
  }
}

// scripts/user_db.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Hp/Downloads/infathon%20zip%20(2)/infathon/scripts/user_db.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var DB_FILE = path.join(__dirname, "../data/users.json");
function ensureDBExists() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
  }
}
function getAllUsersFromDB() {
  ensureDBExists();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error("[UserDB Error] Reading database:", err.message);
    return [];
  }
}
function writeUsersToDB(users) {
  ensureDBExists();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.error("[UserDB Error] Writing database:", err.message);
    return false;
  }
}
function saveOrUpdateUserInDB(userData) {
  if (!userData || !userData.email) {
    throw new Error("Valid user with email is required.");
  }
  const users = getAllUsersFromDB();
  const emailNorm = userData.email.trim().toLowerCase();
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === emailNorm || userData.id && u.id === userData.id);
  const nowStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const userRecord = {
    id: userData.id || (existingIndex !== -1 ? users[existingIndex].id : "usr_" + Date.now()),
    name: userData.name || (existingIndex !== -1 ? users[existingIndex].name : "Citizen"),
    email: emailNorm,
    createdAt: existingIndex !== -1 ? users[existingIndex].createdAt : nowStr,
    lastLogin: nowStr,
    profile: userData.profile || (existingIndex !== -1 ? users[existingIndex].profile : null),
    eligibleSchemes: userData.eligibleSchemes || (existingIndex !== -1 ? users[existingIndex].eligibleSchemes : []),
    eligibleSchemesCount: (userData.eligibleSchemes ? userData.eligibleSchemes.length : existingIndex !== -1 ? users[existingIndex].eligibleSchemesCount : 0) || 0,
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
function deleteUserFromDB(emailOrId) {
  if (!emailOrId) return false;
  const users = getAllUsersFromDB();
  const query = emailOrId.trim().toLowerCase();
  const filtered = users.filter((u) => u.email.toLowerCase() !== query && u.id !== emailOrId);
  if (filtered.length !== users.length) {
    writeUsersToDB(filtered);
    console.log(`[UserDB] Deleted user record: ${emailOrId}`);
    return true;
  }
  return false;
}
function seedInitialUsersDB(schemesList = []) {
  ensureDBExists();
  const users = getAllUsersFromDB();
  if (users.length > 0) return;
  console.log("[UserDB] Initializing citizen database with demo profiles...");
  const rameshProfile = {
    gender: "Male",
    age: 42,
    occupation: "Farmer",
    income: 18e4,
    location: "Gujarat",
    district: "Anand",
    disabled: "No",
    caste: "OBC",
    area: "Rural"
  };
  const poojaProfile = {
    gender: "Female",
    age: 20,
    occupation: "Student",
    income: 12e4,
    location: "Uttar Pradesh",
    district: "Lucknow",
    disabled: "No",
    caste: "SC",
    area: "Urban"
  };
  const filterEligible = (profile) => {
    if (!schemesList || schemesList.length === 0) return [];
    return schemesList.filter((s) => {
      const e = s.eligibility;
      if (e.gender && !e.gender.includes(profile.gender)) return false;
      if (e.minAge !== void 0 && profile.age < e.minAge) return false;
      if (e.maxAge !== void 0 && profile.age > e.maxAge) return false;
      if (e.occupation && !e.occupation.includes(profile.occupation)) return false;
      if (e.maxIncome && profile.income > e.maxIncome) return false;
      if (e.location && e.location !== "Central" && e.location !== profile.location) return false;
      if (e.caste && !e.caste.includes(profile.caste)) return false;
      if (e.area && !e.area.includes(profile.area)) return false;
      if (e.disabledOnly && profile.disabled === "No") return false;
      return true;
    }).map((s) => ({
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
      id: "user_demo_farmer",
      name: "Ramesh Patel",
      email: "farmer@demo.gov",
      createdAt: "16 Oct 2026, 06:00 AM",
      lastLogin: "16 Oct 2026, 06:15 AM",
      profile: rameshProfile,
      eligibleSchemes: rameshSchemes,
      eligibleSchemesCount: rameshSchemes.length,
      updatedAt: "16 Oct 2026, 06:15 AM"
    },
    {
      id: "user_demo_student",
      name: "Pooja Verma",
      email: "student@demo.gov",
      createdAt: "16 Oct 2026, 06:00 AM",
      lastLogin: "16 Oct 2026, 06:15 AM",
      profile: poojaProfile,
      eligibleSchemes: poojaSchemes,
      eligibleSchemesCount: poojaSchemes.length,
      updatedAt: "16 Oct 2026, 06:15 AM"
    }
  ];
  writeUsersToDB(initialUsers);
  console.log(`[UserDB] Seeded ${initialUsers.length} citizen records successfully.`);
}

// scripts/schemes_db.js
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __vite_injected_original_import_meta_url2 = "file:///C:/Users/Hp/Downloads/infathon%20zip%20(2)/infathon/scripts/schemes_db.js";
var __filename2 = fileURLToPath2(__vite_injected_original_import_meta_url2);
var __dirname2 = path2.dirname(__filename2);
var SCHEMES_FILE = path2.join(__dirname2, "../public/data/schemes.json");
var BACKUP_SCHEMES_FILE = path2.join(__dirname2, "../data/schemes.json");
var NOTIFS_FILE = path2.join(__dirname2, "../data/official_notifications.json");
function ensureNotifsFileExists() {
  const dir = path2.dirname(NOTIFS_FILE);
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
  }
  if (!fs2.existsSync(NOTIFS_FILE)) {
    fs2.writeFileSync(NOTIFS_FILE, JSON.stringify([], null, 2));
  }
}
function getAllSchemes() {
  try {
    if (fs2.existsSync(SCHEMES_FILE)) {
      const raw = fs2.readFileSync(SCHEMES_FILE, "utf-8");
      return JSON.parse(raw) || [];
    } else if (fs2.existsSync(BACKUP_SCHEMES_FILE)) {
      const raw = fs2.readFileSync(BACKUP_SCHEMES_FILE, "utf-8");
      return JSON.parse(raw) || [];
    }
    return [];
  } catch (err) {
    console.error("[SchemesDB Error] Reading schemes:", err.message);
    return [];
  }
}
function writeSchemes(schemes) {
  try {
    const dir = path2.dirname(SCHEMES_FILE);
    if (!fs2.existsSync(dir)) fs2.mkdirSync(dir, { recursive: true });
    fs2.writeFileSync(SCHEMES_FILE, JSON.stringify(schemes, null, 2), "utf-8");
    const backupDir = path2.dirname(BACKUP_SCHEMES_FILE);
    if (fs2.existsSync(backupDir)) {
      fs2.writeFileSync(BACKUP_SCHEMES_FILE, JSON.stringify(schemes, null, 2), "utf-8");
    }
    return true;
  } catch (err) {
    console.error("[SchemesDB Error] Writing schemes:", err.message);
    return false;
  }
}
function getAllOfficialNotifications() {
  ensureNotifsFileExists();
  try {
    const raw = fs2.readFileSync(NOTIFS_FILE, "utf-8");
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error("[SchemesDB Error] Reading notifications:", err.message);
    return [];
  }
}
function saveOfficialNotification(notif) {
  ensureNotifsFileExists();
  try {
    const notifs = getAllOfficialNotifications();
    notifs.unshift(notif);
    const trimmed = notifs.slice(0, 100);
    fs2.writeFileSync(NOTIFS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[SchemesDB Error] Saving notification:", err.message);
    return false;
  }
}
function isUserEligibleForScheme(userProfile, eligibility) {
  if (!userProfile) return true;
  if (!eligibility) return true;
  if (eligibility.gender && Array.isArray(eligibility.gender) && eligibility.gender.length > 0) {
    if (userProfile.gender && !eligibility.gender.includes(userProfile.gender) && !eligibility.gender.includes("Any")) {
      return false;
    }
  }
  if (eligibility.minAge !== void 0 && userProfile.age !== void 0 && userProfile.age < eligibility.minAge) {
    return false;
  }
  if (eligibility.maxAge !== void 0 && userProfile.age !== void 0 && userProfile.age > eligibility.maxAge) {
    return false;
  }
  if (eligibility.occupation && Array.isArray(eligibility.occupation) && eligibility.occupation.length > 0) {
    if (!eligibility.occupation.includes("All") && !eligibility.occupation.includes("Any")) {
      const userOcc = userProfile.occupation;
      const secondary = userProfile.nlpResult?.secondaryRoles || [];
      const userRoles = [userOcc, ...secondary].filter(Boolean);
      const matches = eligibility.occupation.some((occ) => userRoles.includes(occ));
      if (!matches) return false;
    }
  }
  if (eligibility.maxIncome && userProfile.income && userProfile.income > eligibility.maxIncome) {
    return false;
  }
  if (eligibility.location && eligibility.location !== "Central" && eligibility.location !== "All India") {
    if (userProfile.location && userProfile.location !== eligibility.location) {
      return false;
    }
  }
  if (eligibility.caste && Array.isArray(eligibility.caste) && eligibility.caste.length > 0) {
    if (userProfile.caste && !eligibility.caste.includes(userProfile.caste) && !eligibility.caste.includes("Any")) {
      return false;
    }
  }
  if (eligibility.area && Array.isArray(eligibility.area) && eligibility.area.length > 0) {
    if (userProfile.area && !eligibility.area.includes(userProfile.area) && !eligibility.area.includes("Any")) {
      return false;
    }
  }
  if (eligibility.disabledOnly && userProfile.disabled === "No") {
    return false;
  }
  return true;
}
function saveOrUpdateScheme(schemeData, bulletinData = {}) {
  if (!schemeData || !schemeData.name) {
    throw new Error("Scheme name is required.");
  }
  const schemes = getAllSchemes();
  const existingIndex = schemes.findIndex(
    (s) => schemeData.id && s.id === schemeData.id || s.name.trim().toLowerCase() === schemeData.name.trim().toLowerCase()
  );
  const isNew = existingIndex === -1;
  const now = /* @__PURE__ */ new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const timeFormatted = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  let schemeId = schemeData.id;
  if (!schemeId) {
    schemeId = schemeData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!schemeId) schemeId = "scheme_" + Date.now();
  }
  let benefits = [];
  if (Array.isArray(schemeData.benefits)) {
    benefits = schemeData.benefits.filter(Boolean);
  } else if (typeof schemeData.benefits === "string") {
    benefits = schemeData.benefits.split(/\n|;|\./).map((b) => b.trim()).filter(Boolean);
  }
  if (benefits.length === 0) {
    benefits = [schemeData.description || "Welfare assistance and financial support."];
  }
  let applicationSteps = [];
  if (Array.isArray(schemeData.applicationSteps)) {
    applicationSteps = schemeData.applicationSteps.filter(Boolean);
  } else if (typeof schemeData.applicationSteps === "string") {
    applicationSteps = schemeData.applicationSteps.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
  }
  if (applicationSteps.length === 0) {
    applicationSteps = [
      "Visit the official welfare portal",
      "Verify Aadhaar / demographic eligibility",
      "Submit online registration form"
    ];
  }
  let requiredDocuments = [];
  if (Array.isArray(schemeData.requiredDocuments)) {
    requiredDocuments = schemeData.requiredDocuments.filter(Boolean);
  } else if (typeof schemeData.requiredDocuments === "string") {
    requiredDocuments = schemeData.requiredDocuments.split(/\n|,|;/).map((d) => d.trim()).filter(Boolean);
  }
  if (requiredDocuments.length === 0) {
    requiredDocuments = ["Aadhaar Card", "Bank Passbook / Account Details", "Passport Size Photograph"];
  }
  const finalScheme = {
    id: schemeId,
    name: schemeData.name.trim(),
    category: schemeData.category || "General Welfare",
    ministry: schemeData.ministry || "Ministry of Social Justice and Welfare",
    description: schemeData.description || benefits[0] || "Government Welfare Scheme.",
    benefits,
    eligibility: {
      minAge: schemeData.eligibility?.minAge !== void 0 ? Number(schemeData.eligibility.minAge) : 0,
      maxAge: schemeData.eligibility?.maxAge !== void 0 ? Number(schemeData.eligibility.maxAge) : 125,
      location: schemeData.eligibility?.location || "Central",
      gender: Array.isArray(schemeData.eligibility?.gender) && schemeData.eligibility.gender.length > 0 ? schemeData.eligibility.gender : ["Male", "Female", "Other"],
      caste: Array.isArray(schemeData.eligibility?.caste) && schemeData.eligibility.caste.length > 0 ? schemeData.eligibility.caste : ["General", "OBC", "SC", "ST"],
      area: Array.isArray(schemeData.eligibility?.area) && schemeData.eligibility.area.length > 0 ? schemeData.eligibility.area : ["Rural", "Urban"],
      occupation: Array.isArray(schemeData.eligibility?.occupation) && schemeData.eligibility.occupation.length > 0 ? schemeData.eligibility.occupation : ["All"],
      maxIncome: schemeData.eligibility?.maxIncome ? Number(schemeData.eligibility.maxIncome) : void 0,
      disabledOnly: Boolean(schemeData.eligibility?.disabledOnly)
    },
    applicationSteps,
    officialLink: schemeData.officialLink || "https://www.myscheme.gov.in/",
    applicationMode: schemeData.applicationMode || "Both",
    requiredDocuments,
    deadline: schemeData.deadline || "Active / Open Enrollment",
    lastUpdated: dateFormatted
  };
  if (isNew) {
    schemes.unshift(finalScheme);
  } else {
    schemes[existingIndex] = { ...schemes[existingIndex], ...finalScheme };
  }
  writeSchemes(schemes);
  const customSummary = bulletinData.summary || bulletinData.noticeBody || "";
  const notifType = bulletinData.type || (isNew ? "announcement" : "benefit_update");
  let notifTitle = bulletinData.title;
  if (!notifTitle) {
    if (isNew) {
      notifTitle = `\u{1F4E2} Official Gazette: Launch of ${finalScheme.name}`;
    } else {
      notifTitle = `\u{1F4CB} Official Scheme Revision: ${finalScheme.name}`;
    }
  }
  let notifBody = "";
  if (customSummary) {
    notifBody = `Official Welfare Gazette (${dateFormatted}): ${customSummary} Eligible citizens are advised to review the revised guidelines and apply on the official portal.`;
  } else if (isNew) {
    notifBody = `Government Notification (${dateFormatted}): '${finalScheme.name}' has been officially launched under ${finalScheme.ministry}. Key Benefits: ${benefits.slice(0, 2).join("; ")}. Applications are now open on the official national portal.`;
  } else {
    notifBody = `Official Revision Bulletin dated ${dateFormatted}: The operational provisions and criteria for '${finalScheme.name}' have been updated. Primary benefits: ${benefits.slice(0, 2).join("; ")}. Beneficiaries may verify eligibility on the national portal.`;
  }
  const officialNotification = {
    id: "notif_gov_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
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
  saveOfficialNotification(officialNotification);
  let affectedUsersCount = 0;
  try {
    const users = getAllUsersFromDB();
    users.forEach((u) => {
      const p = u.profile;
      const eligible = isUserEligibleForScheme(p, finalScheme.eligibility);
      if (!u.eligibleSchemes) u.eligibleSchemes = [];
      const sIndex = u.eligibleSchemes.findIndex((s) => s.id === finalScheme.id || s.name.toLowerCase() === finalScheme.name.toLowerCase());
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
        u.eligibleSchemes.splice(sIndex, 1);
        u.eligibleSchemesCount = u.eligibleSchemes.length;
      }
      if (!u.notifications) u.notifications = [];
      u.notifications.unshift(officialNotification);
      if (u.notifications.length > 50) u.notifications = u.notifications.slice(0, 50);
      u.updatedAt = timeFormatted;
    });
    writeUsersToDB(users);
  } catch (err) {
    console.warn("[SchemesDB] User update sync notice:", err.message);
  }
  return {
    success: true,
    isNew,
    scheme: finalScheme,
    notification: officialNotification,
    affectedUsersCount
  };
}
function deleteSchemeFromDB(schemeId) {
  if (!schemeId) return false;
  const schemes = getAllSchemes();
  const filtered = schemes.filter((s) => s.id !== schemeId);
  if (filtered.length !== schemes.length) {
    writeSchemes(filtered);
    return true;
  }
  return false;
}

// vite.config.js
import { fileURLToPath as fileURLToPath3 } from "url";
import path3 from "path";
var __vite_injected_original_import_meta_url3 = "file:///C:/Users/Hp/Downloads/infathon%20zip%20(2)/infathon/vite.config.js";
var __filename3 = fileURLToPath3(__vite_injected_original_import_meta_url3);
var __dirname3 = path3.dirname(__filename3);
try {
  seedInitialUsersDB();
} catch (_) {
}
var vite_config_default = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path3.resolve(__dirname3, "index.html"),
        admin: path3.resolve(__dirname3, "admin.html")
      }
    }
  },
  plugins: [
    {
      name: "live-gov-scheme-and-user-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const parsedUrl = new URL(req.url, "http://localhost");
          if (parsedUrl.pathname === "/api/live-scheme") {
            try {
              const targetUrl = parsedUrl.searchParams.get("url");
              const schemeName = parsedUrl.searchParams.get("name") || "";
              const refresh = parsedUrl.searchParams.get("refresh") === "true";
              if (!targetUrl) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: false, error: "URL parameter is required." }));
                return;
              }
              const liveData = await scrapeLiveGovScheme(targetUrl, schemeName, refresh);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(liveData));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }
          if (parsedUrl.pathname === "/api/users" && req.method === "GET") {
            try {
              const users = getAllUsersFromDB();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true, count: users.length, users }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }
          if (parsedUrl.pathname === "/api/users/sync" && (req.method === "POST" || req.method === "PUT")) {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const userData = JSON.parse(body || "{}");
                const savedUser = saveOrUpdateUserInDB(userData);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, user: savedUser }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
          if (parsedUrl.pathname === "/api/users/delete" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const { email, id } = JSON.parse(body || "{}");
                const ok = deleteUserFromDB(email || id);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: ok, message: ok ? "User deleted" : "User not found" }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
          if (parsedUrl.pathname === "/api/schemes" && req.method === "GET") {
            try {
              const schemes = getAllSchemes();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true, count: schemes.length, schemes }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }
          if (parsedUrl.pathname === "/api/schemes/save" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const { scheme, bulletin } = JSON.parse(body || "{}");
                const result = saveOrUpdateScheme(scheme, bulletin);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
          if (parsedUrl.pathname === "/api/schemes/delete" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const { id } = JSON.parse(body || "{}");
                const ok = deleteSchemeFromDB(id);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: ok, message: ok ? "Scheme deleted" : "Scheme not found" }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
          if (parsedUrl.pathname === "/api/notifications" && req.method === "GET") {
            try {
              const notifs = getAllOfficialNotifications();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true, count: notifs.length, notifications: notifs }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }
          if (parsedUrl.pathname === "/api/notifications/add" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const notifData = JSON.parse(body || "{}");
                saveOfficialNotification(notifData);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, notification: notifData }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2NyaXB0cy9saXZlX3NjcmFwZXIuanMiLCAic2NyaXB0cy91c2VyX2RiLmpzIiwgInNjcmlwdHMvc2NoZW1lc19kYi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhwXFxcXERvd25sb2Fkc1xcXFxpbmZhdGhvbiB6aXAgKDIpXFxcXGluZmF0aG9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIcFxcXFxEb3dubG9hZHNcXFxcaW5mYXRob24gemlwICgyKVxcXFxpbmZhdGhvblxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSHAvRG93bmxvYWRzL2luZmF0aG9uJTIwemlwJTIwKDIpL2luZmF0aG9uL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBzY3JhcGVMaXZlR292U2NoZW1lIH0gZnJvbSAnLi9zY3JpcHRzL2xpdmVfc2NyYXBlci5qcyc7XG5pbXBvcnQgeyBnZXRBbGxVc2Vyc0Zyb21EQiwgc2F2ZU9yVXBkYXRlVXNlckluREIsIGRlbGV0ZVVzZXJGcm9tREIsIHNlZWRJbml0aWFsVXNlcnNEQiB9IGZyb20gJy4vc2NyaXB0cy91c2VyX2RiLmpzJztcbmltcG9ydCB7IGdldEFsbFNjaGVtZXMsIHNhdmVPclVwZGF0ZVNjaGVtZSwgZGVsZXRlU2NoZW1lRnJvbURCLCBnZXRBbGxPZmZpY2lhbE5vdGlmaWNhdGlvbnMsIHNhdmVPZmZpY2lhbE5vdGlmaWNhdGlvbiB9IGZyb20gJy4vc2NyaXB0cy9zY2hlbWVzX2RiLmpzJztcblxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcblxuLy8gU2VlZCBkZW1vIHVzZXJzIGlmIGRhdGFiYXNlIGlzIGVtcHR5XG50cnkge1xuICBzZWVkSW5pdGlhbFVzZXJzREIoKTtcbn0gY2F0Y2ggKF8pIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKSxcbiAgICAgICAgYWRtaW46IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdhZG1pbi5odG1sJylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICB7XG4gICAgICBuYW1lOiAnbGl2ZS1nb3Ytc2NoZW1lLWFuZC11c2VyLWFwaScsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkVXJsID0gbmV3IFVSTChyZXEudXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuXG4gICAgICAgICAgLy8gMS4gTGl2ZSBTY2hlbWUgU2NyYXBpbmcgQVBJXG4gICAgICAgICAgaWYgKHBhcnNlZFVybC5wYXRobmFtZSA9PT0gJy9hcGkvbGl2ZS1zY2hlbWUnKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSBwYXJzZWRVcmwuc2VhcmNoUGFyYW1zLmdldCgndXJsJyk7XG4gICAgICAgICAgICAgIGNvbnN0IHNjaGVtZU5hbWUgPSBwYXJzZWRVcmwuc2VhcmNoUGFyYW1zLmdldCgnbmFtZScpIHx8ICcnO1xuICAgICAgICAgICAgICBjb25zdCByZWZyZXNoID0gcGFyc2VkVXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3JlZnJlc2gnKSA9PT0gJ3RydWUnO1xuXG4gICAgICAgICAgICAgIGlmICghdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVVJMIHBhcmFtZXRlciBpcyByZXF1aXJlZC4nIH0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBsaXZlRGF0YSA9IGF3YWl0IHNjcmFwZUxpdmVHb3ZTY2hlbWUodGFyZ2V0VXJsLCBzY2hlbWVOYW1lLCByZWZyZXNoKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkobGl2ZURhdGEpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDIuIFVzZXIgRGF0YWJhc2UgQVBJIC0gR2V0IEFsbCBVc2Vyc1xuICAgICAgICAgIGlmIChwYXJzZWRVcmwucGF0aG5hbWUgPT09ICcvYXBpL3VzZXJzJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgdXNlcnMgPSBnZXRBbGxVc2Vyc0Zyb21EQigpO1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGNvdW50OiB1c2Vycy5sZW5ndGgsIHVzZXJzIH0pKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDMuIFVzZXIgRGF0YWJhc2UgQVBJIC0gU3luYyAvIFNhdmUgVXNlciBSZWNvcmQgJiBFbGlnaWJsZSBTY2hlbWVzXG4gICAgICAgICAgaWYgKHBhcnNlZFVybC5wYXRobmFtZSA9PT0gJy9hcGkvdXNlcnMvc3luYycgJiYgKHJlcS5tZXRob2QgPT09ICdQT1NUJyB8fCByZXEubWV0aG9kID09PSAnUFVUJykpIHtcbiAgICAgICAgICAgIGxldCBib2R5ID0gJyc7XG4gICAgICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bms7IH0pO1xuICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9Jyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2F2ZWRVc2VyID0gc2F2ZU9yVXBkYXRlVXNlckluREIodXNlckRhdGEpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHVzZXI6IHNhdmVkVXNlciB9KSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyA0LiBVc2VyIERhdGFiYXNlIEFQSSAtIERlbGV0ZSBVc2VyIFJlY29yZFxuICAgICAgICAgIGlmIChwYXJzZWRVcmwucGF0aG5hbWUgPT09ICcvYXBpL3VzZXJzL2RlbGV0ZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rOyB9KTtcbiAgICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZW1haWwsIGlkIH0gPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9Jyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2sgPSBkZWxldGVVc2VyRnJvbURCKGVtYWlsIHx8IGlkKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBvaywgbWVzc2FnZTogb2sgPyAnVXNlciBkZWxldGVkJyA6ICdVc2VyIG5vdCBmb3VuZCcgfSkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gNS4gU2NoZW1lcyBBUEkgLSBHZXQgQWxsIFNjaGVtZXNcbiAgICAgICAgICBpZiAocGFyc2VkVXJsLnBhdGhuYW1lID09PSAnL2FwaS9zY2hlbWVzJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgc2NoZW1lcyA9IGdldEFsbFNjaGVtZXMoKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBjb3VudDogc2NoZW1lcy5sZW5ndGgsIHNjaGVtZXMgfSkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gNi4gU2NoZW1lcyBBUEkgLSBDcmVhdGUgb3IgVXBkYXRlIFNjaGVtZSAmIERpc3BhdGNoIE9mZmljaWFsIE5vdGlmaWNhdGlvblxuICAgICAgICAgIGlmIChwYXJzZWRVcmwucGF0aG5hbWUgPT09ICcvYXBpL3NjaGVtZXMvc2F2ZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rOyB9KTtcbiAgICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2NoZW1lLCBidWxsZXRpbiB9ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNhdmVPclVwZGF0ZVNjaGVtZShzY2hlbWUsIGJ1bGxldGluKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCAuLi5yZXN1bHQgfSkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gNy4gU2NoZW1lcyBBUEkgLSBEZWxldGUgU2NoZW1lXG4gICAgICAgICAgaWYgKHBhcnNlZFVybC5wYXRobmFtZSA9PT0gJy9hcGkvc2NoZW1lcy9kZWxldGUnICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcbiAgICAgICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuazsgfSk7XG4gICAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGlkIH0gPSBKU09OLnBhcnNlKGJvZHkgfHwgJ3t9Jyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2sgPSBkZWxldGVTY2hlbWVGcm9tREIoaWQpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IG9rLCBtZXNzYWdlOiBvayA/ICdTY2hlbWUgZGVsZXRlZCcgOiAnU2NoZW1lIG5vdCBmb3VuZCcgfSkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gOC4gTm90aWZpY2F0aW9ucyBBUEkgLSBHZXQgT2ZmaWNpYWwgQnJvYWRjYXN0IE5vdGlmaWNhdGlvbnNcbiAgICAgICAgICBpZiAocGFyc2VkVXJsLnBhdGhuYW1lID09PSAnL2FwaS9ub3RpZmljYXRpb25zJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgbm90aWZzID0gZ2V0QWxsT2ZmaWNpYWxOb3RpZmljYXRpb25zKCk7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgY291bnQ6IG5vdGlmcy5sZW5ndGgsIG5vdGlmaWNhdGlvbnM6IG5vdGlmcyB9KSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyA5LiBOb3RpZmljYXRpb25zIEFQSSAtIEFkZCBPZmZpY2lhbCBOb3RpZmljYXRpb24gZGlyZWN0bHlcbiAgICAgICAgICBpZiAocGFyc2VkVXJsLnBhdGhuYW1lID09PSAnL2FwaS9ub3RpZmljYXRpb25zL2FkZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rOyB9KTtcbiAgICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vdGlmRGF0YSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcbiAgICAgICAgICAgICAgICBzYXZlT2ZmaWNpYWxOb3RpZmljYXRpb24obm90aWZEYXRhKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBub3RpZmljYXRpb246IG5vdGlmRGF0YSB9KSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgXVxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhwXFxcXERvd25sb2Fkc1xcXFxpbmZhdGhvbiB6aXAgKDIpXFxcXGluZmF0aG9uXFxcXHNjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhwXFxcXERvd25sb2Fkc1xcXFxpbmZhdGhvbiB6aXAgKDIpXFxcXGluZmF0aG9uXFxcXHNjcmlwdHNcXFxcbGl2ZV9zY3JhcGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9IcC9Eb3dubG9hZHMvaW5mYXRob24lMjB6aXAlMjAoMikvaW5mYXRob24vc2NyaXB0cy9saXZlX3NjcmFwZXIuanNcIjtpbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5cbmNvbnN0IGh0dHBzQWdlbnQgPSBuZXcgaHR0cHMuQWdlbnQoe1xuICAgIHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UsXG4gICAgc2VjdXJlT3B0aW9uczogY3J5cHRvLmNvbnN0YW50cy5TU0xfT1BfTEVHQUNZX1NFUlZFUl9DT05ORUNUIC8vIEVzc2VudGlhbCBmb3IgbGVnYWN5IE5JQyAvIHN0YXRlIGdvdmVybm1lbnQgU1NMIHNlcnZlcnNcbn0pO1xuXG4vLyBJbi1tZW1vcnkgY2FjaGUgZm9yIGxpdmUgc2NyYXBlZCByZXN1bHRzICg1IG1pbnV0ZSBUVEwpXG5jb25zdCBsaXZlQ2FjaGUgPSBuZXcgTWFwKCk7XG5jb25zdCBDQUNIRV9UVExfTVMgPSA1ICogNjAgKiAxMDAwO1xuXG4vKipcbiAqIFNjcmFwZXMgYW5kIGV4dHJhY3RzIGxpdmUgaW5mb3JtYXRpb24gZGlyZWN0bHkgZnJvbSBhbiBvZmZpY2lhbCBnb3Zlcm5tZW50IHBvcnRhbC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBPZmZpY2lhbCBnb3Zlcm5tZW50IHNjaGVtZSBVUkxcbiAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWVOYW1lIC0gU2NoZW1lIG5hbWUgZm9yIGNvbnRleHQvZmFsbGJhY2tcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VSZWZyZXNoIC0gSWYgdHJ1ZSwgYnlwYXNzZXMgdGhlIGluLW1lbW9yeSBjYWNoZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NyYXBlTGl2ZUdvdlNjaGVtZSh1cmwsIHNjaGVtZU5hbWUgPSAnJywgZm9yY2VSZWZyZXNoID0gZmFsc2UpIHtcbiAgICBpZiAoIXVybCB8fCB0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3JNZXNzYWdlOiAnSW52YWxpZCBvciBtaXNzaW5nIFVSTC4nIH07XG4gICAgfVxuXG4gICAgY29uc3QgY2FjaGVLZXkgPSB1cmwudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgY2FjaGVkID0gbGl2ZUNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgaWYgKCFmb3JjZVJlZnJlc2ggJiYgY2FjaGVkICYmIChEYXRlLm5vdygpIC0gY2FjaGVkLnRpbWVzdGFtcCA8IENBQ0hFX1RUTF9NUykpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtMaXZlU2NyYXBlcl0gUmV0dXJuaW5nIGNhY2hlZCBsaXZlIGRhdGEgZm9yICR7dXJsfWApO1xuICAgICAgICByZXR1cm4geyAuLi5jYWNoZWQuZGF0YSwgZnJvbUNhY2hlOiB0cnVlIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBsZXQgZG9tYWluID0gJyc7XG4gICAgdHJ5IHtcbiAgICAgICAgZG9tYWluID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgZG9tYWluID0gdXJsO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbTGl2ZVNjcmFwZXJdIENvbnRhY3Rpbmcgb2ZmaWNpYWwgcG9ydGFsIGluIHJlYWwtdGltZTogJHt1cmx9YCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldCh1cmwsIHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICAgICAgICAgICAgICAgICdBY2NlcHQnOiAndGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksaW1hZ2Uvd2VicCwqLyo7cT0wLjgnLFxuICAgICAgICAgICAgICAgICdBY2NlcHQtTGFuZ3VhZ2UnOiAnZW4tSU4sZW4tR0IsZW47cT0wLjksaGk7cT0wLjgnLFxuICAgICAgICAgICAgICAgICdDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJyxcbiAgICAgICAgICAgICAgICAnUHJhZ21hJzogJ25vLWNhY2hlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGh0dHBzQWdlbnQsXG4gICAgICAgICAgICB0aW1lb3V0OiAxMjAwMCxcbiAgICAgICAgICAgIG1heFJlZGlyZWN0czogNVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBsYXRlbmN5ID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgICAgY29uc3QgaHRtbCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIGNvbnN0ICQgPSBjaGVlcmlvLmxvYWQoaHRtbCk7XG5cbiAgICAgICAgLy8gU3RyaXAgbm9uLWNvbnRlbnQgdGFnc1xuICAgICAgICAkKCdzY3JpcHQsIHN0eWxlLCBub3NjcmlwdCwgc3ZnLCBpZnJhbWUnKS5yZW1vdmUoKTtcblxuICAgICAgICBjb25zdCB0aXRsZSA9ICQoJ3RpdGxlJykudGV4dCgpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCk7XG4gICAgICAgIGNvbnN0IG1ldGFEZXNjID0gJCgnbWV0YVtuYW1lPVwiZGVzY3JpcHRpb25cIl0nKS5hdHRyKCdjb250ZW50JykgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgJCgnbWV0YVtwcm9wZXJ0eT1cIm9nOmRlc2NyaXB0aW9uXCJdJykuYXR0cignY29udGVudCcpIHx8ICcnO1xuXG4gICAgICAgIC8vIDEuIExpdmUgQW5ub3VuY2VtZW50cyAvIE5vdGlmaWNhdGlvbnMgLyBNYXJxdWVlIHRpY2tlcnNcbiAgICAgICAgY29uc3QgYW5ub3VuY2VtZW50cyA9IFtdO1xuICAgICAgICAkKCdtYXJxdWVlLCAubWFycXVlZSwgLmFsZXJ0LCAubm90aWZpY2F0aW9uLCAudGlja2VyLCAuYW5ub3VuY2VtZW50LCAubGF0ZXN0LXVwZGF0ZSwgLm5ld3MtdGlja2VyLCAubmV3cywgLnVwZGF0ZXMnKS5lYWNoKChfLCBlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9ICQoZWwpLnRleHQoKS5yZXBsYWNlKC9cXHMrL2csICcgJykudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gMjAgJiYgdGV4dC5sZW5ndGggPCAzMDAgJiYgIWFubm91bmNlbWVudHMuaW5jbHVkZXModGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhbm5vdW5jZW1lbnRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIDIuIExpdmUgRWxpZ2liaWxpdHkgaW5mb3JtYXRpb25cbiAgICAgICAgY29uc3QgbGl2ZUVsaWdpYmlsaXR5ID0gW107XG4gICAgICAgIGNvbnN0IGVsaWdpYmlsaXR5S2V5d29yZHMgPSBbJ2VsaWdpYicsICd3aG8gY2FuIGFwcGx5JywgJ2NyaXRlcmlhJywgJ3BhdHJhdGEnLCAnZ3VpZGVsaW5lcycsICdiZW5lZmljaWFyJ107XG4gICAgICAgIFxuICAgICAgICAkKCdoMSwgaDIsIGgzLCBoNCwgaDUsIHN0cm9uZywgYiwgZHQnKS5lYWNoKChfLCBlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaGVhZGluZ1RleHQgPSAkKGVsKS50ZXh0KCkudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAoZWxpZ2liaWxpdHlLZXl3b3Jkcy5zb21lKGt3ID0+IGhlYWRpbmdUZXh0LmluY2x1ZGVzKGt3KSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0VWwgPSAkKGVsKS5uZXh0KCd1bCwgb2wnKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFVsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0VWwuZmluZCgnbGknKS5lYWNoKChfLCBsaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9ICQobGkpLnRleHQoKS5yZXBsYWNlKC9cXHMrL2csICcgJykudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMTAgJiYgaXRlbS5sZW5ndGggPCAyNTAgJiYgIWxpdmVFbGlnaWJpbGl0eS5pbmNsdWRlcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpdmVFbGlnaWJpbGl0eS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0UCA9ICQoZWwpLm5leHQoJ3AsIGRkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0UC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBUZXh0ID0gbmV4dFAudGV4dCgpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocFRleHQubGVuZ3RoID4gMTUgJiYgcFRleHQubGVuZ3RoIDwgMzUwICYmICFsaXZlRWxpZ2liaWxpdHkuaW5jbHVkZXMocFRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGl2ZUVsaWdpYmlsaXR5LnB1c2gocFRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyAzLiBMaXZlIEJlbmVmaXRzICYgZmluYW5jaWFsIGFzc2lzdGFuY2UgbWVudGlvbnNcbiAgICAgICAgY29uc3QgbGl2ZUJlbmVmaXRzID0gW107XG4gICAgICAgICQoJ3AsIGxpJykuZWFjaCgoXywgZWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSAkKGVsKS50ZXh0KCkucmVwbGFjZSgvXFxzKy9nLCAnICcpLnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAodGV4dC5pbmNsdWRlcygnXHUyMEI5JykgfHwgdGV4dC5pbmNsdWRlcygnUnMuJykgfHwgdGV4dC5pbmNsdWRlcygnUnMgJykgfHwgL3N1YnNpZC9pLnRlc3QodGV4dCkgfHwgL2ZpbmFuY2lhbCBhc3Npc3RhbmNlL2kudGVzdCh0ZXh0KSB8fCAvaW5jZW50aXZlL2kudGVzdCh0ZXh0KSkgJiZcbiAgICAgICAgICAgICAgICB0ZXh0Lmxlbmd0aCA+IDE1ICYmIHRleHQubGVuZ3RoIDwgMjUwICYmXG4gICAgICAgICAgICAgICAgIWxpdmVCZW5lZml0cy5pbmNsdWRlcyh0ZXh0KVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpdmVCZW5lZml0cy5sZW5ndGggPCA1KSBsaXZlQmVuZWZpdHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gNC4gSGVscGxpbmVzICYgQ29udGFjdCBpbmZvXG4gICAgICAgIGNvbnN0IGhlbHBsaW5lcyA9IFtdO1xuICAgICAgICBjb25zdCBib2R5VGV4dCA9ICQoJ2JvZHknKS50ZXh0KCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgICBjb25zdCBwaG9uZVJlZ2V4ID0gLyg/OjE4MDBbLVxcc10/WzAtOV17M31bLVxcc10/WzAtOV17Myw0fXwwMTFbLVxcc10/WzAtOV17Nyw4fXxcXCs5MVstXFxzXT9bMC05XXsxMH18KD86aGVscGxpbmV8dG9sbCBmcmVlfGNhbGwgY2VudGVyKVs6XFxzXStbMC05XFwtXFxzXXs4LDE1fSkvZ2k7XG4gICAgICAgIGNvbnN0IHBob25lTWF0Y2hlcyA9IGJvZHlUZXh0Lm1hdGNoKHBob25lUmVnZXgpO1xuICAgICAgICBpZiAocGhvbmVNYXRjaGVzKSB7XG4gICAgICAgICAgICBwaG9uZU1hdGNoZXMuc2xpY2UoMCwgMykuZm9yRWFjaChtID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGVhbmVkID0gbS50cmltKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFoZWxwbGluZXMuaW5jbHVkZXMoY2xlYW5lZCkpIGhlbHBsaW5lcy5wdXNoKGNsZWFuZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyA1LiBEZXRlY3RlZCBkb2N1bWVudHMgbWVudGlvbmVkIG9uIHRoZSBsaXZlIHBhZ2VcbiAgICAgICAgY29uc3QgZG9jS2V5d29yZHMgPSBbXG4gICAgICAgICAgICAnQWFkaGFhciBDYXJkJywgJ0luY29tZSBDZXJ0aWZpY2F0ZScsICdDYXN0ZSBDZXJ0aWZpY2F0ZScsICdSYXRpb24gQ2FyZCcsIFxuICAgICAgICAgICAgJ0JhbmsgQWNjb3VudCcsICdMYW5kIFJlY29yZHMgKFJUQyknLCAnUGFzc3BvcnQgUGhvdG8nLCAnUEFOIENhcmQnLCBcbiAgICAgICAgICAgICdWb3RlciBJRCcsICdEb21pY2lsZSBDZXJ0aWZpY2F0ZScsICdCaXJ0aCBDZXJ0aWZpY2F0ZSdcbiAgICAgICAgXTtcbiAgICAgICAgY29uc3QgZGV0ZWN0ZWREb2N1bWVudHMgPSBbXTtcbiAgICAgICAgZG9jS2V5d29yZHMuZm9yRWFjaChkb2MgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmFzZVRlcm0gPSBkb2Muc3BsaXQoJyAnKVswXTtcbiAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXFxcXGIke2Jhc2VUZXJtfVxcXFxiYCwgJ2knKTtcbiAgICAgICAgICAgIGlmIChyZWdleC50ZXN0KGJvZHlUZXh0KSAmJiAhZGV0ZWN0ZWREb2N1bWVudHMuaW5jbHVkZXMoZG9jKSkge1xuICAgICAgICAgICAgICAgIGRldGVjdGVkRG9jdW1lbnRzLnB1c2goZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbGl2ZURhdGEgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgc291cmNlOiAnbGl2ZV9nb3ZfcG9ydGFsJyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIGRvbWFpbixcbiAgICAgICAgICAgIHBhZ2VUaXRsZTogdGl0bGUgfHwgc2NoZW1lTmFtZSxcbiAgICAgICAgICAgIG1ldGFEZXNjcmlwdGlvbjogbWV0YURlc2MsXG4gICAgICAgICAgICBsYXRlbmN5TXM6IGxhdGVuY3ksXG4gICAgICAgICAgICBodHRwU3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgICBpc0xpdmU6IHRydWUsXG4gICAgICAgICAgICBmZXRjaGVkQXQ6IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCksXG4gICAgICAgICAgICBhbm5vdW5jZW1lbnRzOiBhbm5vdW5jZW1lbnRzLnNsaWNlKDAsIDMpLFxuICAgICAgICAgICAgbGl2ZUVsaWdpYmlsaXR5OiBsaXZlRWxpZ2liaWxpdHkuc2xpY2UoMCwgNSksXG4gICAgICAgICAgICBsaXZlQmVuZWZpdHM6IGxpdmVCZW5lZml0cy5zbGljZSgwLCA0KSxcbiAgICAgICAgICAgIGhlbHBsaW5lcyxcbiAgICAgICAgICAgIGRldGVjdGVkRG9jdW1lbnRzXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ2FjaGUgc3VjY2Vzc2Z1bCByZXNwb25zZVxuICAgICAgICBsaXZlQ2FjaGUuc2V0KGNhY2hlS2V5LCB7IHRpbWVzdGFtcDogRGF0ZS5ub3coKSwgZGF0YTogbGl2ZURhdGEgfSk7XG4gICAgICAgIHJldHVybiBsaXZlRGF0YTtcblxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbTGl2ZVNjcmFwZXIgRXJyb3JdIENvdWxkIG5vdCByZWFjaCAke3VybH06YCwgZXJyLm1lc3NhZ2UpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIHNvdXJjZTogJ2xpdmVfZ292X3BvcnRhbF9lcnJvcicsXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICBkb21haW4sXG4gICAgICAgICAgICBwYWdlVGl0bGU6IHNjaGVtZU5hbWUsXG4gICAgICAgICAgICBsYXRlbmN5TXM6IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgICAgICBodHRwU3RhdHVzOiBlcnIucmVzcG9uc2U/LnN0YXR1cyB8fCA1MDMsXG4gICAgICAgICAgICBpc0xpdmU6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiBlcnIubWVzc2FnZS5pbmNsdWRlcygndGltZW91dCcpID8gJ09mZmljaWFsIHBvcnRhbCByZXNwb25zZSB0aW1lZCBvdXQuJyA6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgZmV0Y2hlZEF0OiBuZXcgRGF0ZSgpLnRvTG9jYWxlVGltZVN0cmluZygpXG4gICAgICAgIH07XG4gICAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIcFxcXFxEb3dubG9hZHNcXFxcaW5mYXRob24gemlwICgyKVxcXFxpbmZhdGhvblxcXFxzY3JpcHRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIcFxcXFxEb3dubG9hZHNcXFxcaW5mYXRob24gemlwICgyKVxcXFxpbmZhdGhvblxcXFxzY3JpcHRzXFxcXHVzZXJfZGIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0hwL0Rvd25sb2Fkcy9pbmZhdGhvbiUyMHppcCUyMCgyKS9pbmZhdGhvbi9zY3JpcHRzL3VzZXJfZGIuanNcIjtpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcbmNvbnN0IERCX0ZJTEUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZGF0YS91c2Vycy5qc29uJyk7XG5cbi8qKlxuICogRW5zdXJlIGRhdGEgZGlyZWN0b3J5IGFuZCB1c2Vycy5qc29uIGV4aXN0XG4gKi9cbmZ1bmN0aW9uIGVuc3VyZURCRXhpc3RzKCkge1xuICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShEQl9GSUxFKTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKERCX0ZJTEUpKSB7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoREJfRklMRSwgSlNPTi5zdHJpbmdpZnkoW10sIG51bGwsIDIpKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVhZCBhbGwgdXNlcnMgZnJvbSB0aGUgSlNPTiBkYXRhYmFzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsVXNlcnNGcm9tREIoKSB7XG4gICAgZW5zdXJlREJFeGlzdHMoKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoREJfRklMRSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJhdykgfHwgW107XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tVc2VyREIgRXJyb3JdIFJlYWRpbmcgZGF0YWJhc2U6JywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuXG4vKipcbiAqIFdyaXRlIHVwZGF0ZWQgdXNlcnMgbGlzdCB0byB0aGUgSlNPTiBkYXRhYmFzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVc2Vyc1RvREIodXNlcnMpIHtcbiAgICBlbnN1cmVEQkV4aXN0cygpO1xuICAgIHRyeSB7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoREJfRklMRSwgSlNPTi5zdHJpbmdpZnkodXNlcnMsIG51bGwsIDIpKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tVc2VyREIgRXJyb3JdIFdyaXRpbmcgZGF0YWJhc2U6JywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIFNhdmUgb3IgdXBkYXRlIGEgY2l0aXplbiBpbiB0aGUgZGF0YWJhc2Ugd2l0aCB0aGVpciBwcm9maWxlIGFuZCBlbGlnaWJsZSBzY2hlbWVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlT3JVcGRhdGVVc2VySW5EQih1c2VyRGF0YSkge1xuICAgIGlmICghdXNlckRhdGEgfHwgIXVzZXJEYXRhLmVtYWlsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsaWQgdXNlciB3aXRoIGVtYWlsIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXJzID0gZ2V0QWxsVXNlcnNGcm9tREIoKTtcbiAgICBjb25zdCBlbWFpbE5vcm0gPSB1c2VyRGF0YS5lbWFpbC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBleGlzdGluZ0luZGV4ID0gdXNlcnMuZmluZEluZGV4KHUgPT4gdS5lbWFpbC50b0xvd2VyQ2FzZSgpID09PSBlbWFpbE5vcm0gfHwgKHVzZXJEYXRhLmlkICYmIHUuaWQgPT09IHVzZXJEYXRhLmlkKSk7XG5cbiAgICBjb25zdCBub3dTdHIgPSBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicsIHsgdGltZVpvbmU6ICdBc2lhL0tvbGthdGEnIH0pO1xuXG4gICAgY29uc3QgdXNlclJlY29yZCA9IHtcbiAgICAgICAgaWQ6IHVzZXJEYXRhLmlkIHx8IChleGlzdGluZ0luZGV4ICE9PSAtMSA/IHVzZXJzW2V4aXN0aW5nSW5kZXhdLmlkIDogJ3Vzcl8nICsgRGF0ZS5ub3coKSksXG4gICAgICAgIG5hbWU6IHVzZXJEYXRhLm5hbWUgfHwgKGV4aXN0aW5nSW5kZXggIT09IC0xID8gdXNlcnNbZXhpc3RpbmdJbmRleF0ubmFtZSA6ICdDaXRpemVuJyksXG4gICAgICAgIGVtYWlsOiBlbWFpbE5vcm0sXG4gICAgICAgIGNyZWF0ZWRBdDogZXhpc3RpbmdJbmRleCAhPT0gLTEgPyB1c2Vyc1tleGlzdGluZ0luZGV4XS5jcmVhdGVkQXQgOiBub3dTdHIsXG4gICAgICAgIGxhc3RMb2dpbjogbm93U3RyLFxuICAgICAgICBwcm9maWxlOiB1c2VyRGF0YS5wcm9maWxlIHx8IChleGlzdGluZ0luZGV4ICE9PSAtMSA/IHVzZXJzW2V4aXN0aW5nSW5kZXhdLnByb2ZpbGUgOiBudWxsKSxcbiAgICAgICAgZWxpZ2libGVTY2hlbWVzOiB1c2VyRGF0YS5lbGlnaWJsZVNjaGVtZXMgfHwgKGV4aXN0aW5nSW5kZXggIT09IC0xID8gdXNlcnNbZXhpc3RpbmdJbmRleF0uZWxpZ2libGVTY2hlbWVzIDogW10pLFxuICAgICAgICBlbGlnaWJsZVNjaGVtZXNDb3VudDogKHVzZXJEYXRhLmVsaWdpYmxlU2NoZW1lcyA/IHVzZXJEYXRhLmVsaWdpYmxlU2NoZW1lcy5sZW5ndGggOiAoZXhpc3RpbmdJbmRleCAhPT0gLTEgPyB1c2Vyc1tleGlzdGluZ0luZGV4XS5lbGlnaWJsZVNjaGVtZXNDb3VudCA6IDApKSB8fCAwLFxuICAgICAgICB1cGRhdGVkQXQ6IG5vd1N0clxuICAgIH07XG5cbiAgICBpZiAoZXhpc3RpbmdJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgdXNlcnNbZXhpc3RpbmdJbmRleF0gPSB7IC4uLnVzZXJzW2V4aXN0aW5nSW5kZXhdLCAuLi51c2VyUmVjb3JkIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXNlcnMucHVzaCh1c2VyUmVjb3JkKTtcbiAgICB9XG5cbiAgICB3cml0ZVVzZXJzVG9EQih1c2Vycyk7XG4gICAgY29uc29sZS5sb2coYFtVc2VyREJdIFNhdmVkIGNpdGl6ZW4gcmVjb3JkIGZvcjogJHt1c2VyUmVjb3JkLm5hbWV9ICgke3VzZXJSZWNvcmQuZW1haWx9KSB3aXRoICR7dXNlclJlY29yZC5lbGlnaWJsZVNjaGVtZXNDb3VudH0gZWxpZ2libGUgc2NoZW1lcy5gKTtcbiAgICByZXR1cm4gdXNlclJlY29yZDtcbn1cblxuLyoqXG4gKiBEZWxldGUgYSB1c2VyIGZyb20gdGhlIGRhdGFiYXNlIGJ5IGVtYWlsIG9yIElEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVVc2VyRnJvbURCKGVtYWlsT3JJZCkge1xuICAgIGlmICghZW1haWxPcklkKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgdXNlcnMgPSBnZXRBbGxVc2Vyc0Zyb21EQigpO1xuICAgIGNvbnN0IHF1ZXJ5ID0gZW1haWxPcklkLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IGZpbHRlcmVkID0gdXNlcnMuZmlsdGVyKHUgPT4gdS5lbWFpbC50b0xvd2VyQ2FzZSgpICE9PSBxdWVyeSAmJiB1LmlkICE9PSBlbWFpbE9ySWQpO1xuICAgIGlmIChmaWx0ZXJlZC5sZW5ndGggIT09IHVzZXJzLmxlbmd0aCkge1xuICAgICAgICB3cml0ZVVzZXJzVG9EQihmaWx0ZXJlZCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbVXNlckRCXSBEZWxldGVkIHVzZXIgcmVjb3JkOiAke2VtYWlsT3JJZH1gKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBTZWVkIGluaXRpYWwgZGVtbyBhY2NvdW50cyBpZiBkYXRhYmFzZSBpcyBlbXB0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VlZEluaXRpYWxVc2Vyc0RCKHNjaGVtZXNMaXN0ID0gW10pIHtcbiAgICBlbnN1cmVEQkV4aXN0cygpO1xuICAgIGNvbnN0IHVzZXJzID0gZ2V0QWxsVXNlcnNGcm9tREIoKTtcbiAgICBpZiAodXNlcnMubGVuZ3RoID4gMCkgcmV0dXJuO1xuXG4gICAgY29uc29sZS5sb2coJ1tVc2VyREJdIEluaXRpYWxpemluZyBjaXRpemVuIGRhdGFiYXNlIHdpdGggZGVtbyBwcm9maWxlcy4uLicpO1xuXG4gICAgY29uc3QgcmFtZXNoUHJvZmlsZSA9IHtcbiAgICAgICAgZ2VuZGVyOiAnTWFsZScsXG4gICAgICAgIGFnZTogNDIsXG4gICAgICAgIG9jY3VwYXRpb246ICdGYXJtZXInLFxuICAgICAgICBpbmNvbWU6IDE4MDAwMCxcbiAgICAgICAgbG9jYXRpb246ICdHdWphcmF0JyxcbiAgICAgICAgZGlzdHJpY3Q6ICdBbmFuZCcsXG4gICAgICAgIGRpc2FibGVkOiAnTm8nLFxuICAgICAgICBjYXN0ZTogJ09CQycsXG4gICAgICAgIGFyZWE6ICdSdXJhbCdcbiAgICB9O1xuXG4gICAgY29uc3QgcG9vamFQcm9maWxlID0ge1xuICAgICAgICBnZW5kZXI6ICdGZW1hbGUnLFxuICAgICAgICBhZ2U6IDIwLFxuICAgICAgICBvY2N1cGF0aW9uOiAnU3R1ZGVudCcsXG4gICAgICAgIGluY29tZTogMTIwMDAwLFxuICAgICAgICBsb2NhdGlvbjogJ1V0dGFyIFByYWRlc2gnLFxuICAgICAgICBkaXN0cmljdDogJ0x1Y2tub3cnLFxuICAgICAgICBkaXNhYmxlZDogJ05vJyxcbiAgICAgICAgY2FzdGU6ICdTQycsXG4gICAgICAgIGFyZWE6ICdVcmJhbidcbiAgICB9O1xuXG4gICAgY29uc3QgZmlsdGVyRWxpZ2libGUgPSAocHJvZmlsZSkgPT4ge1xuICAgICAgICBpZiAoIXNjaGVtZXNMaXN0IHx8IHNjaGVtZXNMaXN0Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gc2NoZW1lc0xpc3QuZmlsdGVyKHMgPT4ge1xuICAgICAgICAgICAgY29uc3QgZSA9IHMuZWxpZ2liaWxpdHk7XG4gICAgICAgICAgICBpZiAoZS5nZW5kZXIgJiYgIWUuZ2VuZGVyLmluY2x1ZGVzKHByb2ZpbGUuZ2VuZGVyKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGUubWluQWdlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZS5hZ2UgPCBlLm1pbkFnZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGUubWF4QWdlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZS5hZ2UgPiBlLm1heEFnZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGUub2NjdXBhdGlvbiAmJiAhZS5vY2N1cGF0aW9uLmluY2x1ZGVzKHByb2ZpbGUub2NjdXBhdGlvbikpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChlLm1heEluY29tZSAmJiBwcm9maWxlLmluY29tZSA+IGUubWF4SW5jb21lKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoZS5sb2NhdGlvbiAmJiBlLmxvY2F0aW9uICE9PSAnQ2VudHJhbCcgJiYgZS5sb2NhdGlvbiAhPT0gcHJvZmlsZS5sb2NhdGlvbikgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKGUuY2FzdGUgJiYgIWUuY2FzdGUuaW5jbHVkZXMocHJvZmlsZS5jYXN0ZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChlLmFyZWEgJiYgIWUuYXJlYS5pbmNsdWRlcyhwcm9maWxlLmFyZWEpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoZS5kaXNhYmxlZE9ubHkgJiYgcHJvZmlsZS5kaXNhYmxlZCA9PT0gJ05vJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pLm1hcChzID0+ICh7XG4gICAgICAgICAgICBpZDogcy5pZCxcbiAgICAgICAgICAgIG5hbWU6IHMubmFtZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBzLmNhdGVnb3J5LFxuICAgICAgICAgICAgb2ZmaWNpYWxMaW5rOiBzLm9mZmljaWFsTGluayxcbiAgICAgICAgICAgIGFwcGxpY2F0aW9uTW9kZTogcy5hcHBsaWNhdGlvbk1vZGVcbiAgICAgICAgfSkpO1xuICAgIH07XG5cbiAgICBjb25zdCByYW1lc2hTY2hlbWVzID0gZmlsdGVyRWxpZ2libGUocmFtZXNoUHJvZmlsZSk7XG4gICAgY29uc3QgcG9vamFTY2hlbWVzID0gZmlsdGVyRWxpZ2libGUocG9vamFQcm9maWxlKTtcblxuICAgIGNvbnN0IGluaXRpYWxVc2VycyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICd1c2VyX2RlbW9fZmFybWVyJyxcbiAgICAgICAgICAgIG5hbWU6ICdSYW1lc2ggUGF0ZWwnLFxuICAgICAgICAgICAgZW1haWw6ICdmYXJtZXJAZGVtby5nb3YnLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiAnMTYgT2N0IDIwMjYsIDA2OjAwIEFNJyxcbiAgICAgICAgICAgIGxhc3RMb2dpbjogJzE2IE9jdCAyMDI2LCAwNjoxNSBBTScsXG4gICAgICAgICAgICBwcm9maWxlOiByYW1lc2hQcm9maWxlLFxuICAgICAgICAgICAgZWxpZ2libGVTY2hlbWVzOiByYW1lc2hTY2hlbWVzLFxuICAgICAgICAgICAgZWxpZ2libGVTY2hlbWVzQ291bnQ6IHJhbWVzaFNjaGVtZXMubGVuZ3RoLFxuICAgICAgICAgICAgdXBkYXRlZEF0OiAnMTYgT2N0IDIwMjYsIDA2OjE1IEFNJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ3VzZXJfZGVtb19zdHVkZW50JyxcbiAgICAgICAgICAgIG5hbWU6ICdQb29qYSBWZXJtYScsXG4gICAgICAgICAgICBlbWFpbDogJ3N0dWRlbnRAZGVtby5nb3YnLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiAnMTYgT2N0IDIwMjYsIDA2OjAwIEFNJyxcbiAgICAgICAgICAgIGxhc3RMb2dpbjogJzE2IE9jdCAyMDI2LCAwNjoxNSBBTScsXG4gICAgICAgICAgICBwcm9maWxlOiBwb29qYVByb2ZpbGUsXG4gICAgICAgICAgICBlbGlnaWJsZVNjaGVtZXM6IHBvb2phU2NoZW1lcyxcbiAgICAgICAgICAgIGVsaWdpYmxlU2NoZW1lc0NvdW50OiBwb29qYVNjaGVtZXMubGVuZ3RoLFxuICAgICAgICAgICAgdXBkYXRlZEF0OiAnMTYgT2N0IDIwMjYsIDA2OjE1IEFNJ1xuICAgICAgICB9XG4gICAgXTtcblxuICAgIHdyaXRlVXNlcnNUb0RCKGluaXRpYWxVc2Vycyk7XG4gICAgY29uc29sZS5sb2coYFtVc2VyREJdIFNlZWRlZCAke2luaXRpYWxVc2Vycy5sZW5ndGh9IGNpdGl6ZW4gcmVjb3JkcyBzdWNjZXNzZnVsbHkuYCk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhwXFxcXERvd25sb2Fkc1xcXFxpbmZhdGhvbiB6aXAgKDIpXFxcXGluZmF0aG9uXFxcXHNjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhwXFxcXERvd25sb2Fkc1xcXFxpbmZhdGhvbiB6aXAgKDIpXFxcXGluZmF0aG9uXFxcXHNjcmlwdHNcXFxcc2NoZW1lc19kYi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSHAvRG93bmxvYWRzL2luZmF0aG9uJTIwemlwJTIwKDIpL2luZmF0aG9uL3NjcmlwdHMvc2NoZW1lc19kYi5qc1wiO2ltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgZ2V0QWxsVXNlcnNGcm9tREIsIHdyaXRlVXNlcnNUb0RCIH0gZnJvbSAnLi91c2VyX2RiLmpzJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcblxuY29uc3QgU0NIRU1FU19GSUxFID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3B1YmxpYy9kYXRhL3NjaGVtZXMuanNvbicpO1xuY29uc3QgQkFDS1VQX1NDSEVNRVNfRklMRSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kYXRhL3NjaGVtZXMuanNvbicpO1xuY29uc3QgTk9USUZTX0ZJTEUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZGF0YS9vZmZpY2lhbF9ub3RpZmljYXRpb25zLmpzb24nKTtcblxuLyoqXG4gKiBFbnN1cmUgb2ZmaWNpYWxfbm90aWZpY2F0aW9ucy5qc29uIGV4aXN0c1xuICovXG5mdW5jdGlvbiBlbnN1cmVOb3RpZnNGaWxlRXhpc3RzKCkge1xuICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShOT1RJRlNfRklMRSk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfVxuICAgIGlmICghZnMuZXhpc3RzU3luYyhOT1RJRlNfRklMRSkpIHtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhOT1RJRlNfRklMRSwgSlNPTi5zdHJpbmdpZnkoW10sIG51bGwsIDIpKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVhZCBhbGwgc2NoZW1lcyBmcm9tIHB1YmxpYy9kYXRhL3NjaGVtZXMuanNvblxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsU2NoZW1lcygpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhTQ0hFTUVTX0ZJTEUpKSB7XG4gICAgICAgICAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoU0NIRU1FU19GSUxFLCAndXRmLTgnKTtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJhdykgfHwgW107XG4gICAgICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhCQUNLVVBfU0NIRU1FU19GSUxFKSkge1xuICAgICAgICAgICAgY29uc3QgcmF3ID0gZnMucmVhZEZpbGVTeW5jKEJBQ0tVUF9TQ0hFTUVTX0ZJTEUsICd1dGYtOCcpO1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmF3KSB8fCBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW107XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTY2hlbWVzREIgRXJyb3JdIFJlYWRpbmcgc2NoZW1lczonLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG59XG5cbi8qKlxuICogV3JpdGUgc2NoZW1lcyBhcnJheSBiYWNrIHRvIHB1YmxpYy9kYXRhL3NjaGVtZXMuanNvblxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVTY2hlbWVzKHNjaGVtZXMpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoU0NIRU1FU19GSUxFKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKFNDSEVNRVNfRklMRSwgSlNPTi5zdHJpbmdpZnkoc2NoZW1lcywgbnVsbCwgMiksICd1dGYtOCcpO1xuXG4gICAgICAgIC8vIEFsc28gd3JpdGUgdG8gYmFja3VwIGlmIGRhdGEvIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgY29uc3QgYmFja3VwRGlyID0gcGF0aC5kaXJuYW1lKEJBQ0tVUF9TQ0hFTUVTX0ZJTEUpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhiYWNrdXBEaXIpKSB7XG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKEJBQ0tVUF9TQ0hFTUVTX0ZJTEUsIEpTT04uc3RyaW5naWZ5KHNjaGVtZXMsIG51bGwsIDIpLCAndXRmLTgnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW1NjaGVtZXNEQiBFcnJvcl0gV3JpdGluZyBzY2hlbWVzOicsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZWFkIG9mZmljaWFsIG5vdGlmaWNhdGlvbnMgZnJvbSBkYXRhL29mZmljaWFsX25vdGlmaWNhdGlvbnMuanNvblxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsT2ZmaWNpYWxOb3RpZmljYXRpb25zKCkge1xuICAgIGVuc3VyZU5vdGlmc0ZpbGVFeGlzdHMoKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByYXcgPSBmcy5yZWFkRmlsZVN5bmMoTk9USUZTX0ZJTEUsICd1dGYtOCcpO1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShyYXcpIHx8IFtdO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbU2NoZW1lc0RCIEVycm9yXSBSZWFkaW5nIG5vdGlmaWNhdGlvbnM6JywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuXG4vKipcbiAqIFNhdmUgYW4gb2ZmaWNpYWwgbm90aWZpY2F0aW9uIHRvIHRoZSBvZmZpY2lhbCBub3RpZmljYXRpb25zIGZpbGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVPZmZpY2lhbE5vdGlmaWNhdGlvbihub3RpZikge1xuICAgIGVuc3VyZU5vdGlmc0ZpbGVFeGlzdHMoKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBub3RpZnMgPSBnZXRBbGxPZmZpY2lhbE5vdGlmaWNhdGlvbnMoKTtcbiAgICAgICAgLy8gSW5zZXJ0IGF0IGJlZ2lubmluZyAobmV3ZXN0IGZpcnN0KSwgbGltaXQgdG8gMTAwXG4gICAgICAgIG5vdGlmcy51bnNoaWZ0KG5vdGlmKTtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IG5vdGlmcy5zbGljZSgwLCAxMDApO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKE5PVElGU19GSUxFLCBKU09OLnN0cmluZ2lmeSh0cmltbWVkLCBudWxsLCAyKSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbU2NoZW1lc0RCIEVycm9yXSBTYXZpbmcgbm90aWZpY2F0aW9uOicsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGNpdGl6ZW4ncyBwcm9maWxlIG1hdGNoZXMgZWxpZ2liaWxpdHkgZm9yIGEgc2NoZW1lXG4gKi9cbmZ1bmN0aW9uIGlzVXNlckVsaWdpYmxlRm9yU2NoZW1lKHVzZXJQcm9maWxlLCBlbGlnaWJpbGl0eSkge1xuICAgIGlmICghdXNlclByb2ZpbGUpIHJldHVybiB0cnVlO1xuICAgIGlmICghZWxpZ2liaWxpdHkpIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKGVsaWdpYmlsaXR5LmdlbmRlciAmJiBBcnJheS5pc0FycmF5KGVsaWdpYmlsaXR5LmdlbmRlcikgJiYgZWxpZ2liaWxpdHkuZ2VuZGVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKHVzZXJQcm9maWxlLmdlbmRlciAmJiAhZWxpZ2liaWxpdHkuZ2VuZGVyLmluY2x1ZGVzKHVzZXJQcm9maWxlLmdlbmRlcikgJiYgIWVsaWdpYmlsaXR5LmdlbmRlci5pbmNsdWRlcygnQW55JykpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbGlnaWJpbGl0eS5taW5BZ2UgIT09IHVuZGVmaW5lZCAmJiB1c2VyUHJvZmlsZS5hZ2UgIT09IHVuZGVmaW5lZCAmJiB1c2VyUHJvZmlsZS5hZ2UgPCBlbGlnaWJpbGl0eS5taW5BZ2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZWxpZ2liaWxpdHkubWF4QWdlICE9PSB1bmRlZmluZWQgJiYgdXNlclByb2ZpbGUuYWdlICE9PSB1bmRlZmluZWQgJiYgdXNlclByb2ZpbGUuYWdlID4gZWxpZ2liaWxpdHkubWF4QWdlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoZWxpZ2liaWxpdHkub2NjdXBhdGlvbiAmJiBBcnJheS5pc0FycmF5KGVsaWdpYmlsaXR5Lm9jY3VwYXRpb24pICYmIGVsaWdpYmlsaXR5Lm9jY3VwYXRpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoIWVsaWdpYmlsaXR5Lm9jY3VwYXRpb24uaW5jbHVkZXMoJ0FsbCcpICYmICFlbGlnaWJpbGl0eS5vY2N1cGF0aW9uLmluY2x1ZGVzKCdBbnknKSkge1xuICAgICAgICAgICAgY29uc3QgdXNlck9jYyA9IHVzZXJQcm9maWxlLm9jY3VwYXRpb247XG4gICAgICAgICAgICBjb25zdCBzZWNvbmRhcnkgPSB1c2VyUHJvZmlsZS5ubHBSZXN1bHQ/LnNlY29uZGFyeVJvbGVzIHx8IFtdO1xuICAgICAgICAgICAgY29uc3QgdXNlclJvbGVzID0gW3VzZXJPY2MsIC4uLnNlY29uZGFyeV0uZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGVsaWdpYmlsaXR5Lm9jY3VwYXRpb24uc29tZShvY2MgPT4gdXNlclJvbGVzLmluY2x1ZGVzKG9jYykpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaGVzKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZWxpZ2liaWxpdHkubWF4SW5jb21lICYmIHVzZXJQcm9maWxlLmluY29tZSAmJiB1c2VyUHJvZmlsZS5pbmNvbWUgPiBlbGlnaWJpbGl0eS5tYXhJbmNvbWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChlbGlnaWJpbGl0eS5sb2NhdGlvbiAmJiBlbGlnaWJpbGl0eS5sb2NhdGlvbiAhPT0gJ0NlbnRyYWwnICYmIGVsaWdpYmlsaXR5LmxvY2F0aW9uICE9PSAnQWxsIEluZGlhJykge1xuICAgICAgICBpZiAodXNlclByb2ZpbGUubG9jYXRpb24gJiYgdXNlclByb2ZpbGUubG9jYXRpb24gIT09IGVsaWdpYmlsaXR5LmxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZWxpZ2liaWxpdHkuY2FzdGUgJiYgQXJyYXkuaXNBcnJheShlbGlnaWJpbGl0eS5jYXN0ZSkgJiYgZWxpZ2liaWxpdHkuY2FzdGUubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAodXNlclByb2ZpbGUuY2FzdGUgJiYgIWVsaWdpYmlsaXR5LmNhc3RlLmluY2x1ZGVzKHVzZXJQcm9maWxlLmNhc3RlKSAmJiAhZWxpZ2liaWxpdHkuY2FzdGUuaW5jbHVkZXMoJ0FueScpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZWxpZ2liaWxpdHkuYXJlYSAmJiBBcnJheS5pc0FycmF5KGVsaWdpYmlsaXR5LmFyZWEpICYmIGVsaWdpYmlsaXR5LmFyZWEubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAodXNlclByb2ZpbGUuYXJlYSAmJiAhZWxpZ2liaWxpdHkuYXJlYS5pbmNsdWRlcyh1c2VyUHJvZmlsZS5hcmVhKSAmJiAhZWxpZ2liaWxpdHkuYXJlYS5pbmNsdWRlcygnQW55JykpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbGlnaWJpbGl0eS5kaXNhYmxlZE9ubHkgJiYgdXNlclByb2ZpbGUuZGlzYWJsZWQgPT09ICdObycpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIENyZWF0ZSBvciB1cGRhdGUgYSBzY2hlbWUgbWFudWFsbHlcbiAqIERpc3BhdGNoZXMgYW4gb2ZmaWNpYWwgaW5zdGl0dXRpb25hbCBub3RpZmljYXRpb24gKHdpdGhvdXQgbWVudGlvbmluZyBhZG1pbilcbiAqIGFuZCB1cGRhdGVzIHVzZXIgZWxpZ2libGUgc2NoZW1lcyBpbiBkYXRhL3VzZXJzLmpzb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVPclVwZGF0ZVNjaGVtZShzY2hlbWVEYXRhLCBidWxsZXRpbkRhdGEgPSB7fSkge1xuICAgIGlmICghc2NoZW1lRGF0YSB8fCAhc2NoZW1lRGF0YS5uYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2NoZW1lIG5hbWUgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1lcyA9IGdldEFsbFNjaGVtZXMoKTtcbiAgICBjb25zdCBleGlzdGluZ0luZGV4ID0gc2NoZW1lcy5maW5kSW5kZXgocyA9PlxuICAgICAgICAoc2NoZW1lRGF0YS5pZCAmJiBzLmlkID09PSBzY2hlbWVEYXRhLmlkKSB8fFxuICAgICAgICBzLm5hbWUudHJpbSgpLnRvTG93ZXJDYXNlKCkgPT09IHNjaGVtZURhdGEubmFtZS50cmltKCkudG9Mb3dlckNhc2UoKVxuICAgICk7XG5cbiAgICBjb25zdCBpc05ldyA9IGV4aXN0aW5nSW5kZXggPT09IC0xO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZGF0ZUZvcm1hdHRlZCA9IG5vdy50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUlOJywge1xuICAgICAgICBkYXk6ICcyLWRpZ2l0JyxcbiAgICAgICAgbW9udGg6ICdzaG9ydCcsXG4gICAgICAgIHllYXI6ICdudW1lcmljJ1xuICAgIH0pO1xuICAgIGNvbnN0IHRpbWVGb3JtYXR0ZWQgPSBub3cudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJywge1xuICAgICAgICBkYXk6ICcyLWRpZ2l0JyxcbiAgICAgICAgbW9udGg6ICdzaG9ydCcsXG4gICAgICAgIHllYXI6ICdudW1lcmljJyxcbiAgICAgICAgaG91cjogJzItZGlnaXQnLFxuICAgICAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgICAgICAgaG91cjEyOiB0cnVlXG4gICAgfSk7XG5cbiAgICAvLyBHZW5lcmF0ZSBvciBwcmVzZXJ2ZSBJRFxuICAgIGxldCBzY2hlbWVJZCA9IHNjaGVtZURhdGEuaWQ7XG4gICAgaWYgKCFzY2hlbWVJZCkge1xuICAgICAgICBzY2hlbWVJZCA9IHNjaGVtZURhdGEubmFtZVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC8oXi18LSQpL2csICcnKTtcbiAgICAgICAgaWYgKCFzY2hlbWVJZCkgc2NoZW1lSWQgPSAnc2NoZW1lXycgKyBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIC8vIEZvcm1hdCBiZW5lZml0cyBhcyBhcnJheSBvZiBzdHJpbmdzXG4gICAgbGV0IGJlbmVmaXRzID0gW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1lRGF0YS5iZW5lZml0cykpIHtcbiAgICAgICAgYmVuZWZpdHMgPSBzY2hlbWVEYXRhLmJlbmVmaXRzLmZpbHRlcihCb29sZWFuKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzY2hlbWVEYXRhLmJlbmVmaXRzID09PSAnc3RyaW5nJykge1xuICAgICAgICBiZW5lZml0cyA9IHNjaGVtZURhdGEuYmVuZWZpdHMuc3BsaXQoL1xcbnw7fFxcLi8pLm1hcChiID0+IGIudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgfVxuICAgIGlmIChiZW5lZml0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYmVuZWZpdHMgPSBbc2NoZW1lRGF0YS5kZXNjcmlwdGlvbiB8fCAnV2VsZmFyZSBhc3Npc3RhbmNlIGFuZCBmaW5hbmNpYWwgc3VwcG9ydC4nXTtcbiAgICB9XG5cbiAgICAvLyBGb3JtYXQgYXBwbGljYXRpb24gc3RlcHNcbiAgICBsZXQgYXBwbGljYXRpb25TdGVwcyA9IFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtZURhdGEuYXBwbGljYXRpb25TdGVwcykpIHtcbiAgICAgICAgYXBwbGljYXRpb25TdGVwcyA9IHNjaGVtZURhdGEuYXBwbGljYXRpb25TdGVwcy5maWx0ZXIoQm9vbGVhbik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2NoZW1lRGF0YS5hcHBsaWNhdGlvblN0ZXBzID09PSAnc3RyaW5nJykge1xuICAgICAgICBhcHBsaWNhdGlvblN0ZXBzID0gc2NoZW1lRGF0YS5hcHBsaWNhdGlvblN0ZXBzLnNwbGl0KC9cXG58Oy8pLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgfVxuICAgIGlmIChhcHBsaWNhdGlvblN0ZXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBhcHBsaWNhdGlvblN0ZXBzID0gW1xuICAgICAgICAgICAgJ1Zpc2l0IHRoZSBvZmZpY2lhbCB3ZWxmYXJlIHBvcnRhbCcsXG4gICAgICAgICAgICAnVmVyaWZ5IEFhZGhhYXIgLyBkZW1vZ3JhcGhpYyBlbGlnaWJpbGl0eScsXG4gICAgICAgICAgICAnU3VibWl0IG9ubGluZSByZWdpc3RyYXRpb24gZm9ybSdcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvLyBGb3JtYXQgcmVxdWlyZWQgZG9jdW1lbnRzXG4gICAgbGV0IHJlcXVpcmVkRG9jdW1lbnRzID0gW107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1lRGF0YS5yZXF1aXJlZERvY3VtZW50cykpIHtcbiAgICAgICAgcmVxdWlyZWREb2N1bWVudHMgPSBzY2hlbWVEYXRhLnJlcXVpcmVkRG9jdW1lbnRzLmZpbHRlcihCb29sZWFuKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzY2hlbWVEYXRhLnJlcXVpcmVkRG9jdW1lbnRzID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXF1aXJlZERvY3VtZW50cyA9IHNjaGVtZURhdGEucmVxdWlyZWREb2N1bWVudHMuc3BsaXQoL1xcbnwsfDsvKS5tYXAoZCA9PiBkLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuICAgIH1cbiAgICBpZiAocmVxdWlyZWREb2N1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlcXVpcmVkRG9jdW1lbnRzID0gWydBYWRoYWFyIENhcmQnLCAnQmFuayBQYXNzYm9vayAvIEFjY291bnQgRGV0YWlscycsICdQYXNzcG9ydCBTaXplIFBob3RvZ3JhcGgnXTtcbiAgICB9XG5cbiAgICAvLyBOb3JtYWxpemVkIHNjaGVtZSBvYmplY3RcbiAgICBjb25zdCBmaW5hbFNjaGVtZSA9IHtcbiAgICAgICAgaWQ6IHNjaGVtZUlkLFxuICAgICAgICBuYW1lOiBzY2hlbWVEYXRhLm5hbWUudHJpbSgpLFxuICAgICAgICBjYXRlZ29yeTogc2NoZW1lRGF0YS5jYXRlZ29yeSB8fCAnR2VuZXJhbCBXZWxmYXJlJyxcbiAgICAgICAgbWluaXN0cnk6IHNjaGVtZURhdGEubWluaXN0cnkgfHwgJ01pbmlzdHJ5IG9mIFNvY2lhbCBKdXN0aWNlIGFuZCBXZWxmYXJlJyxcbiAgICAgICAgZGVzY3JpcHRpb246IHNjaGVtZURhdGEuZGVzY3JpcHRpb24gfHwgYmVuZWZpdHNbMF0gfHwgJ0dvdmVybm1lbnQgV2VsZmFyZSBTY2hlbWUuJyxcbiAgICAgICAgYmVuZWZpdHM6IGJlbmVmaXRzLFxuICAgICAgICBlbGlnaWJpbGl0eToge1xuICAgICAgICAgICAgbWluQWdlOiBzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Py5taW5BZ2UgIT09IHVuZGVmaW5lZCA/IE51bWJlcihzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Lm1pbkFnZSkgOiAwLFxuICAgICAgICAgICAgbWF4QWdlOiBzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Py5tYXhBZ2UgIT09IHVuZGVmaW5lZCA/IE51bWJlcihzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Lm1heEFnZSkgOiAxMjUsXG4gICAgICAgICAgICBsb2NhdGlvbjogc2NoZW1lRGF0YS5lbGlnaWJpbGl0eT8ubG9jYXRpb24gfHwgJ0NlbnRyYWwnLFxuICAgICAgICAgICAgZ2VuZGVyOiBBcnJheS5pc0FycmF5KHNjaGVtZURhdGEuZWxpZ2liaWxpdHk/LmdlbmRlcikgJiYgc2NoZW1lRGF0YS5lbGlnaWJpbGl0eS5nZW5kZXIubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2NoZW1lRGF0YS5lbGlnaWJpbGl0eS5nZW5kZXJcbiAgICAgICAgICAgICAgICA6IFsnTWFsZScsICdGZW1hbGUnLCAnT3RoZXInXSxcbiAgICAgICAgICAgIGNhc3RlOiBBcnJheS5pc0FycmF5KHNjaGVtZURhdGEuZWxpZ2liaWxpdHk/LmNhc3RlKSAmJiBzY2hlbWVEYXRhLmVsaWdpYmlsaXR5LmNhc3RlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNjaGVtZURhdGEuZWxpZ2liaWxpdHkuY2FzdGVcbiAgICAgICAgICAgICAgICA6IFsnR2VuZXJhbCcsICdPQkMnLCAnU0MnLCAnU1QnXSxcbiAgICAgICAgICAgIGFyZWE6IEFycmF5LmlzQXJyYXkoc2NoZW1lRGF0YS5lbGlnaWJpbGl0eT8uYXJlYSkgJiYgc2NoZW1lRGF0YS5lbGlnaWJpbGl0eS5hcmVhLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNjaGVtZURhdGEuZWxpZ2liaWxpdHkuYXJlYVxuICAgICAgICAgICAgICAgIDogWydSdXJhbCcsICdVcmJhbiddLFxuICAgICAgICAgICAgb2NjdXBhdGlvbjogQXJyYXkuaXNBcnJheShzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Py5vY2N1cGF0aW9uKSAmJiBzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Lm9jY3VwYXRpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2NoZW1lRGF0YS5lbGlnaWJpbGl0eS5vY2N1cGF0aW9uXG4gICAgICAgICAgICAgICAgOiBbJ0FsbCddLFxuICAgICAgICAgICAgbWF4SW5jb21lOiBzY2hlbWVEYXRhLmVsaWdpYmlsaXR5Py5tYXhJbmNvbWUgPyBOdW1iZXIoc2NoZW1lRGF0YS5lbGlnaWJpbGl0eS5tYXhJbmNvbWUpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZGlzYWJsZWRPbmx5OiBCb29sZWFuKHNjaGVtZURhdGEuZWxpZ2liaWxpdHk/LmRpc2FibGVkT25seSlcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbGljYXRpb25TdGVwczogYXBwbGljYXRpb25TdGVwcyxcbiAgICAgICAgb2ZmaWNpYWxMaW5rOiBzY2hlbWVEYXRhLm9mZmljaWFsTGluayB8fCAnaHR0cHM6Ly93d3cubXlzY2hlbWUuZ292LmluLycsXG4gICAgICAgIGFwcGxpY2F0aW9uTW9kZTogc2NoZW1lRGF0YS5hcHBsaWNhdGlvbk1vZGUgfHwgJ0JvdGgnLFxuICAgICAgICByZXF1aXJlZERvY3VtZW50czogcmVxdWlyZWREb2N1bWVudHMsXG4gICAgICAgIGRlYWRsaW5lOiBzY2hlbWVEYXRhLmRlYWRsaW5lIHx8ICdBY3RpdmUgLyBPcGVuIEVucm9sbG1lbnQnLFxuICAgICAgICBsYXN0VXBkYXRlZDogZGF0ZUZvcm1hdHRlZFxuICAgIH07XG5cbiAgICAvLyBTYXZlIHNjaGVtZSBpbiBhcnJheVxuICAgIGlmIChpc05ldykge1xuICAgICAgICBzY2hlbWVzLnVuc2hpZnQoZmluYWxTY2hlbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVtZXNbZXhpc3RpbmdJbmRleF0gPSB7IC4uLnNjaGVtZXNbZXhpc3RpbmdJbmRleF0sIC4uLmZpbmFsU2NoZW1lIH07XG4gICAgfVxuXG4gICAgd3JpdGVTY2hlbWVzKHNjaGVtZXMpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gSU5TVElUVVRJT05BTCBOT1RJRklDQVRJT04gR0VORVJBVElPTlxuICAgIC8vIFNUUklDVCBSVUxFOiBOZXZlciBzYXkgXCJhZG1pbiBoYXMgY2hhbmdlZCBpdFwiLlxuICAgIC8vIFBocmFzZSBhcyBvZmZpY2lhbCBtaW5pc3RyeSBnYXpldHRlIC8gd2VsZmFyZSB1cGRhdGUgYnVsbGV0aW4uXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgY3VzdG9tU3VtbWFyeSA9IGJ1bGxldGluRGF0YS5zdW1tYXJ5IHx8IGJ1bGxldGluRGF0YS5ub3RpY2VCb2R5IHx8ICcnO1xuICAgIGNvbnN0IG5vdGlmVHlwZSA9IGJ1bGxldGluRGF0YS50eXBlIHx8IChpc05ldyA/ICdhbm5vdW5jZW1lbnQnIDogJ2JlbmVmaXRfdXBkYXRlJyk7XG4gICAgXG4gICAgbGV0IG5vdGlmVGl0bGUgPSBidWxsZXRpbkRhdGEudGl0bGU7XG4gICAgaWYgKCFub3RpZlRpdGxlKSB7XG4gICAgICAgIGlmIChpc05ldykge1xuICAgICAgICAgICAgbm90aWZUaXRsZSA9IGBcdUQ4M0RcdURDRTIgT2ZmaWNpYWwgR2F6ZXR0ZTogTGF1bmNoIG9mICR7ZmluYWxTY2hlbWUubmFtZX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm90aWZUaXRsZSA9IGBcdUQ4M0RcdURDQ0IgT2ZmaWNpYWwgU2NoZW1lIFJldmlzaW9uOiAke2ZpbmFsU2NoZW1lLm5hbWV9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxldCBub3RpZkJvZHkgPSAnJztcbiAgICBpZiAoY3VzdG9tU3VtbWFyeSkge1xuICAgICAgICBub3RpZkJvZHkgPSBgT2ZmaWNpYWwgV2VsZmFyZSBHYXpldHRlICgke2RhdGVGb3JtYXR0ZWR9KTogJHtjdXN0b21TdW1tYXJ5fSBFbGlnaWJsZSBjaXRpemVucyBhcmUgYWR2aXNlZCB0byByZXZpZXcgdGhlIHJldmlzZWQgZ3VpZGVsaW5lcyBhbmQgYXBwbHkgb24gdGhlIG9mZmljaWFsIHBvcnRhbC5gO1xuICAgIH0gZWxzZSBpZiAoaXNOZXcpIHtcbiAgICAgICAgbm90aWZCb2R5ID0gYEdvdmVybm1lbnQgTm90aWZpY2F0aW9uICgke2RhdGVGb3JtYXR0ZWR9KTogJyR7ZmluYWxTY2hlbWUubmFtZX0nIGhhcyBiZWVuIG9mZmljaWFsbHkgbGF1bmNoZWQgdW5kZXIgJHtmaW5hbFNjaGVtZS5taW5pc3RyeX0uIEtleSBCZW5lZml0czogJHtiZW5lZml0cy5zbGljZSgwLCAyKS5qb2luKCc7ICcpfS4gQXBwbGljYXRpb25zIGFyZSBub3cgb3BlbiBvbiB0aGUgb2ZmaWNpYWwgbmF0aW9uYWwgcG9ydGFsLmA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm90aWZCb2R5ID0gYE9mZmljaWFsIFJldmlzaW9uIEJ1bGxldGluIGRhdGVkICR7ZGF0ZUZvcm1hdHRlZH06IFRoZSBvcGVyYXRpb25hbCBwcm92aXNpb25zIGFuZCBjcml0ZXJpYSBmb3IgJyR7ZmluYWxTY2hlbWUubmFtZX0nIGhhdmUgYmVlbiB1cGRhdGVkLiBQcmltYXJ5IGJlbmVmaXRzOiAke2JlbmVmaXRzLnNsaWNlKDAsIDIpLmpvaW4oJzsgJyl9LiBCZW5lZmljaWFyaWVzIG1heSB2ZXJpZnkgZWxpZ2liaWxpdHkgb24gdGhlIG5hdGlvbmFsIHBvcnRhbC5gO1xuICAgIH1cblxuICAgIGNvbnN0IG9mZmljaWFsTm90aWZpY2F0aW9uID0ge1xuICAgICAgICBpZDogJ25vdGlmX2dvdl8nICsgRGF0ZS5ub3coKSArICdfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA2KSxcbiAgICAgICAgdHlwZTogbm90aWZUeXBlLFxuICAgICAgICBzY2hlbWVJZDogZmluYWxTY2hlbWUuaWQsXG4gICAgICAgIHNjaGVtZU5hbWU6IGZpbmFsU2NoZW1lLm5hbWUsXG4gICAgICAgIHNjaGVtZUNhdGVnb3J5OiBmaW5hbFNjaGVtZS5jYXRlZ29yeSxcbiAgICAgICAgb2ZmaWNpYWxMaW5rOiBmaW5hbFNjaGVtZS5vZmZpY2lhbExpbmssXG4gICAgICAgIHRpdGxlOiBub3RpZlRpdGxlLFxuICAgICAgICBib2R5OiBub3RpZkJvZHksXG4gICAgICAgIHRpbWVzdGFtcDogdGltZUZvcm1hdHRlZCxcbiAgICAgICAgaXNPZmZpY2lhbEJ1bGxldGluOiB0cnVlLFxuICAgICAgICByZWFkOiBmYWxzZVxuICAgIH07XG5cbiAgICAvLyBTYXZlIHRvIHNlcnZlci13aWRlIG9mZmljaWFsIG5vdGlmaWNhdGlvbnMgZmlsZVxuICAgIHNhdmVPZmZpY2lhbE5vdGlmaWNhdGlvbihvZmZpY2lhbE5vdGlmaWNhdGlvbik7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBVUERBVEUgQ0lUSVpFTiBEQVRBQkFTRSAoZGF0YS91c2Vycy5qc29uKVxuICAgIC8vIFN5bmNocm9uaXplIGVsaWdpYmxlIHNjaGVtZXMgJiBhZGQgbm90aWZpY2F0aW9uIHRvIG1hdGNoaW5nIGNpdGl6ZW5zXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgbGV0IGFmZmVjdGVkVXNlcnNDb3VudCA9IDA7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdXNlcnMgPSBnZXRBbGxVc2Vyc0Zyb21EQigpO1xuICAgICAgICB1c2Vycy5mb3JFYWNoKHUgPT4ge1xuICAgICAgICAgICAgY29uc3QgcCA9IHUucHJvZmlsZTtcbiAgICAgICAgICAgIGNvbnN0IGVsaWdpYmxlID0gaXNVc2VyRWxpZ2libGVGb3JTY2hlbWUocCwgZmluYWxTY2hlbWUuZWxpZ2liaWxpdHkpO1xuXG4gICAgICAgICAgICBpZiAoIXUuZWxpZ2libGVTY2hlbWVzKSB1LmVsaWdpYmxlU2NoZW1lcyA9IFtdO1xuICAgICAgICAgICAgY29uc3Qgc0luZGV4ID0gdS5lbGlnaWJsZVNjaGVtZXMuZmluZEluZGV4KHMgPT4gcy5pZCA9PT0gZmluYWxTY2hlbWUuaWQgfHwgcy5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGZpbmFsU2NoZW1lLm5hbWUudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgICAgIGlmIChlbGlnaWJsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjaGVtZVN1bW1hcnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaW5hbFNjaGVtZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZmluYWxTY2hlbWUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IGZpbmFsU2NoZW1lLmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgICAgICBvZmZpY2lhbExpbms6IGZpbmFsU2NoZW1lLm9mZmljaWFsTGluayxcbiAgICAgICAgICAgICAgICAgICAgYXBwbGljYXRpb25Nb2RlOiBmaW5hbFNjaGVtZS5hcHBsaWNhdGlvbk1vZGVcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHNJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdS5lbGlnaWJsZVNjaGVtZXNbc0luZGV4XSA9IHNjaGVtZVN1bW1hcnk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdS5lbGlnaWJsZVNjaGVtZXMucHVzaChzY2hlbWVTdW1tYXJ5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdS5lbGlnaWJsZVNjaGVtZXNDb3VudCA9IHUuZWxpZ2libGVTY2hlbWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBhZmZlY3RlZFVzZXJzQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc0luZGV4ICE9PSAtMSAmJiAhaXNOZXcpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBjcml0ZXJpYSBjaGFuZ2VkIGFuZCB1c2VyIGlzIG5vIGxvbmdlciBlbGlnaWJsZSwgdXBkYXRlXG4gICAgICAgICAgICAgICAgdS5lbGlnaWJsZVNjaGVtZXMuc3BsaWNlKHNJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdS5lbGlnaWJsZVNjaGVtZXNDb3VudCA9IHUuZWxpZ2libGVTY2hlbWVzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWxzbyBtYWludGFpbiB1c2VyLWxldmVsIG5vdGlmaWNhdGlvbiBoaXN0b3J5IGlmIGZpZWxkIGV4aXN0c1xuICAgICAgICAgICAgaWYgKCF1Lm5vdGlmaWNhdGlvbnMpIHUubm90aWZpY2F0aW9ucyA9IFtdO1xuICAgICAgICAgICAgdS5ub3RpZmljYXRpb25zLnVuc2hpZnQob2ZmaWNpYWxOb3RpZmljYXRpb24pO1xuICAgICAgICAgICAgaWYgKHUubm90aWZpY2F0aW9ucy5sZW5ndGggPiA1MCkgdS5ub3RpZmljYXRpb25zID0gdS5ub3RpZmljYXRpb25zLnNsaWNlKDAsIDUwKTtcbiAgICAgICAgICAgIHUudXBkYXRlZEF0ID0gdGltZUZvcm1hdHRlZDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd3JpdGVVc2Vyc1RvREIodXNlcnMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tTY2hlbWVzREJdIFVzZXIgdXBkYXRlIHN5bmMgbm90aWNlOicsIGVyci5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBpc05ldyxcbiAgICAgICAgc2NoZW1lOiBmaW5hbFNjaGVtZSxcbiAgICAgICAgbm90aWZpY2F0aW9uOiBvZmZpY2lhbE5vdGlmaWNhdGlvbixcbiAgICAgICAgYWZmZWN0ZWRVc2Vyc0NvdW50XG4gICAgfTtcbn1cblxuLyoqXG4gKiBEZWxldGUgYSBzY2hlbWUgYnkgSURcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZVNjaGVtZUZyb21EQihzY2hlbWVJZCkge1xuICAgIGlmICghc2NoZW1lSWQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzY2hlbWVzID0gZ2V0QWxsU2NoZW1lcygpO1xuICAgIGNvbnN0IGZpbHRlcmVkID0gc2NoZW1lcy5maWx0ZXIocyA9PiBzLmlkICE9PSBzY2hlbWVJZCk7XG4gICAgaWYgKGZpbHRlcmVkLmxlbmd0aCAhPT0gc2NoZW1lcy5sZW5ndGgpIHtcbiAgICAgICAgd3JpdGVTY2hlbWVzKGZpbHRlcmVkKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1UsU0FBUyxvQkFBb0I7OztBQ0FELE9BQU8sV0FBVztBQUM3WCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxZQUFZO0FBQ25CLFlBQVksYUFBYTtBQUV6QixJQUFNLGFBQWEsSUFBSSxNQUFNLE1BQU07QUFBQSxFQUMvQixvQkFBb0I7QUFBQSxFQUNwQixlQUFlLE9BQU8sVUFBVTtBQUFBO0FBQ3BDLENBQUM7QUFHRCxJQUFNLFlBQVksb0JBQUksSUFBSTtBQUMxQixJQUFNLGVBQWUsSUFBSSxLQUFLO0FBUTlCLGVBQXNCLG9CQUFvQixLQUFLLGFBQWEsSUFBSSxlQUFlLE9BQU87QUFDbEYsTUFBSSxDQUFDLE9BQU8sT0FBTyxRQUFRLFVBQVU7QUFDakMsV0FBTyxFQUFFLFNBQVMsT0FBTyxjQUFjLDBCQUEwQjtBQUFBLEVBQ3JFO0FBRUEsUUFBTSxXQUFXLElBQUksS0FBSyxFQUFFLFlBQVk7QUFDeEMsUUFBTSxTQUFTLFVBQVUsSUFBSSxRQUFRO0FBQ3JDLE1BQUksQ0FBQyxnQkFBZ0IsVUFBVyxLQUFLLElBQUksSUFBSSxPQUFPLFlBQVksY0FBZTtBQUMzRSxZQUFRLElBQUksZ0RBQWdELEdBQUcsRUFBRTtBQUNqRSxXQUFPLEVBQUUsR0FBRyxPQUFPLE1BQU0sV0FBVyxLQUFLO0FBQUEsRUFDN0M7QUFFQSxRQUFNLFlBQVksS0FBSyxJQUFJO0FBQzNCLE1BQUksU0FBUztBQUNiLE1BQUk7QUFDQSxhQUFTLElBQUksSUFBSSxHQUFHLEVBQUU7QUFBQSxFQUMxQixTQUFTLEdBQUc7QUFDUixhQUFTO0FBQUEsRUFDYjtBQUVBLE1BQUk7QUFDQSxZQUFRLElBQUksMERBQTBELEdBQUcsRUFBRTtBQUUzRSxVQUFNLFdBQVcsTUFBTSxNQUFNLElBQUksS0FBSztBQUFBLE1BQ2xDLFNB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LHdCQUF3QixJQUFJLFdBQVcsT0FBTztBQUN2RSxnQkFBSTtBQUNGLG9CQUFNLFNBQVMsNEJBQTRCO0FBQzNDLGtCQUFJLGFBQWE7QUFDakIsa0JBQUksVUFBVSxnQkFBZ0Isa0JBQWtCO0FBQ2hELGtCQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLE9BQU8sT0FBTyxRQUFRLGVBQWUsT0FBTyxDQUFDLENBQUM7QUFBQSxZQUN4RixTQUFTLEtBQUs7QUFDWixrQkFBSSxhQUFhO0FBQ2pCLGtCQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxrQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLFNBQVMsT0FBTyxPQUFPLElBQUksUUFBUSxDQUFDLENBQUM7QUFBQSxZQUNoRTtBQUNBO0FBQUEsVUFDRjtBQUdBLGNBQUksVUFBVSxhQUFhLDRCQUE0QixJQUFJLFdBQVcsUUFBUTtBQUM1RSxnQkFBSSxPQUFPO0FBQ1gsZ0JBQUksR0FBRyxRQUFRLFdBQVM7QUFBRSxzQkFBUTtBQUFBLFlBQU8sQ0FBQztBQUMxQyxnQkFBSSxHQUFHLE9BQU8sTUFBTTtBQUNsQixrQkFBSTtBQUNGLHNCQUFNLFlBQVksS0FBSyxNQUFNLFFBQVEsSUFBSTtBQUN6Qyx5Q0FBeUIsU0FBUztBQUNsQyxvQkFBSSxhQUFhO0FBQ2pCLG9CQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxvQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLFNBQVMsTUFBTSxjQUFjLFVBQVUsQ0FBQyxDQUFDO0FBQUEsY0FDcEUsU0FBUyxLQUFLO0FBQ1osb0JBQUksYUFBYTtBQUNqQixvQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsb0JBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxTQUFTLE9BQU8sT0FBTyxJQUFJLFFBQVEsQ0FBQyxDQUFDO0FBQUEsY0FDaEU7QUFBQSxZQUNGLENBQUM7QUFDRDtBQUFBLFVBQ0Y7QUFFQSxlQUFLO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiXyIsICJmcyIsICJwYXRoIiwgImZpbGVVUkxUb1BhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCIsICJfX2ZpbGVuYW1lIiwgImZpbGVVUkxUb1BhdGgiLCAiX19kaXJuYW1lIiwgInBhdGgiLCAiZnMiLCAiZmlsZVVSTFRvUGF0aCIsICJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwiLCAiX19maWxlbmFtZSIsICJmaWxlVVJMVG9QYXRoIiwgIl9fZGlybmFtZSIsICJwYXRoIl0KfQo=
