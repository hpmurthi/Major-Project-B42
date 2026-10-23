# 🏛️ GovNavigator AI (GovNav)
### *Intelligent Citizen Welfare Scheme Discovery, NLP-Powered Eligibility Matching & Governance Administration Platform*

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vite 5](https://img.shields.io/badge/Vite-v5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vanilla CSS3](https://img.shields.io/badge/Styling-Custom_Glassmorphism-264de4?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Web Scraping](https://img.shields.io/badge/Scraper-Cheerio_%26_Axios-FF8800)](https://cheerio.js.org/)
[![Zero Paid APIs](https://img.shields.io/badge/Dependencies-100%25_Open_Source-success)]()
[![i18n Supported](https://img.shields.io/badge/Languages-English_%7C_Hindi_%7C_Kannada-blue)]()

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [The Problem We Solve](#-the-problem-we-solve)
- [The 6-Step End-to-End AI Workflow Pipeline](#-the-6-step-end-to-end-ai-workflow-pipeline)
- [Core Features & Modules](#-core-features--modules)
  - [1. Citizen Discovery Portal](#1-citizen-discovery-portal-indexhtml)
  - [2. Semantic NLP Entity Extraction](#2-semantic-nlp-entity-extraction-jsnlpjs)
  - [3. Multi-Factor Deterministic Rule Engine](#3-multi-factor-deterministic-rule-engine-jsenginejs)
  - [4. Real-Time Government Web Scraper](#4-real-time-government-web-scraper-scriptslive_scraperjs)
  - [5. Authoritative Admin Governance Console](#5-authoritative-admin-governance-console-adminhtml)
  - [6. Real-Time Gazette Notification Broadcast](#6-real-time-gazette-notification-broadcast)
  - [7. Offline Assistance Locator](#7-offline-assistance-locator)
- [System Architecture](#-system-architecture)
- [Live Demo Credentials & Test Scenarios](#-live-demo-credentials--test-scenarios)
- [Quick Start & Installation](#-quick-start--installation)
- [REST API Reference](#-rest-api-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Key Innovations & Differentiators](#-key-innovations--differentiators)
- [Future Roadmap](#-future-roadmap)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🏛️ Executive Overview

**GovNavigator AI** is a full-stack governance facilitation platform engineered to dismantle the barriers preventing Indian citizens from accessing welfare entitlements. By bridging statistical Natural Language Processing (NLP) with deterministic rule-based legal matching, GovNavigator AI translates bureaucratic government policies into plain-language citizen recommendations.

The platform comes equipped with a **Citizen Discovery Experience**, a persistent **Citizen Database**, real-time **Official Gazette Notifications**, and a protected **Authoritative Admin Governance Console** featuring human-in-the-loop scheme management when scrapers or portals fail.

---

## 🚩 The Problem We Solve

In India, hundreds of Central and State Government welfare schemes exist across Agriculture, Education, Healthcare, Social Security, Housing, and MSME Entrepreneurship. Despite massive annual budgetary allocations, millions of eligible citizens—especially daily wage earners, street vendors, small-scale merchants, and rural families—miss out due to:

1. **Fragmented Information Silos:** Schemes are scattered across dozens of central and state ministry portals with conflicting instructions.
2. **Bureaucratic Jargon:** Eligibility criteria are written in complex legalistic terminology that the average citizen cannot easily comprehend.
3. **Rigid Dropdown Mismatches:** Form dropdowns fail when citizens identify informally (e.g. typing *"I run a roadside tea stall"* instead of choosing *"Street Vendor / Micro-Enterprise"*).
4. **Scraper Breakages & Outdated Portals:** Official portals frequently change layouts, break automated scrapers, or experience SSL legacy errors.
5. **Digital Exclusion of Offline Beneficiaries:** Beneficiaries of offline/in-person schemes (e.g., Gram Panchayat, Post Office, CSC) receive no guidance on where physical assistance centers are located.

GovNavigator AI solves all five systemic challenges with zero external paid API subscriptions.

---

## 🔄 The 6-Step End-to-End AI Workflow Pipeline

The Citizen Discovery flow guides users step-by-step through a transparent 6-stage pipeline:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    STEP 1    │ ──► │    STEP 2    │ ──► │    STEP 3    │ ──► │    STEP 4    │ ──► │    STEP 5    │ ──► │    STEP 6    │
│ User Profile │     │NLP Processing│     │ Eligibility  │     │Recommendations│   │Scheme Details│     │ Application  │
│  Discovery   │     │Semantic Match│     │ Gov Rule Eng │     │& Match Scores│     │ Live Scraper │     │& Physical Loc│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Step 1: User Profile Discovery** — Conversational chatbot gathers essential demographics (Age 0-125, Gender, Occupation, Income, State, District, Area, Caste, Disability) with hands-free voice mic input in **English**, **Hindi**, and **Kannada**.
2. **Step 2: Natural Language Processing (NLP)** — Freeform informal job titles are tokenized, stemmed, and mapped to canonical welfare roles (e.g., *"tea stall on pavement"* ➔ `Street Vendor`, `Entrepreneur`).
3. **Step 3: Multi-Factor Eligibility Engine** — Evaluates hard legal constraints against 56+ cataloged welfare policies without hallucination.
4. **Step 4: AI Recommendations & Fit Scoring** — Calculates match compatibility scores (0% to 100%), tagging schemes with badges (`🔥 Top Match`, `🎯 Recommended`) and clear justification reasons.
5. **Step 5: Scheme Details & Live Portal Verification** — Real-time asynchronous scrape of the official government website extracts live latency, server response, announcement banners, and helpline numbers.
6. **Step 6: Application Guidance & Offline Assistance Locator** — Offers an AI form assistant, a Mock DigiLocker vault for rapid document readiness, and an interactive Google Map pointing to the nearest CSC / Panchayat / Bank branch in the citizen's district.

---

## ⚡ Core Features & Modules

### 1. Citizen Discovery Portal (`index.html`, `main.js`)
* **Interactive Questionnaire & Voice Input:** Web Speech API integration (`webkitSpeechRecognition`) supporting English (`en-IN`), Hindi (`hi-IN`), and Kannada (`kn-IN`).
* **Universal Age Support (0 to 125 Years):** Accommodates newborn nutrition schemes, school scholarships, adult enterprise loans, and centenary super-senior pension funds.
* **Instant Smart Search:** Real-time semantic keyword filtering across 56+ schemes.
* **Actionable Scheme Cards:** Detail modal, official website links, eligibility breakdown, and application modes.
* **Mock DigiLocker Vault:** One-click simulation of document verification (Aadhaar, Ration Card, Income Certificate, Caste Certificate).
* **Export & Sharing Tools:** Clean browser PDF report generation (`@media print`) and instant **WhatsApp Share** (`whatsapp://send?text=...`) for friends and family.

### 2. Semantic NLP Entity Extraction (`js/nlp.js`)
* **Client-Side Semantic Tokenizer:** Identifies informal colloquial occupations, micro-enterprises, and unorganized labor descriptions.
* **Synonym & Keyword Knowledge Base:** Detects keywords like *chai, tea, stall, roadside, thela, dukaan, khana, vendor* and maps them to canonical welfare tags (`Street Vendor`, `Entrepreneur`, `Daily Wager`).
* **Multi-Role Mapping:** Assigns primary and secondary roles with confidence ratings.
* **Transparent Explanation:** Informs the citizen exactly why their informal title was matched to a government classification.

### 3. Multi-Factor Deterministic Rule Engine (`js/engine.js`)
* **Zero Hallucination:** Computes legal entitlement using strictly verifiable attributes:
  * **Age Bracket:** `minAge <= citizen.age <= maxAge`
  * **Gender Criteria:** `Male`, `Female`, `Other`, or `Any`
  * **Income Ceilings:** Strict checks against verified annual household income.
  * **Jurisdiction:** Central schemes (pan-India) vs. State-specific schemes matching the user's location.
  * **Occupational Targeting:** Canonical role matching plus universal access (`All`, `Any`).
  * **Social Category & Disability:** Affirmative action quotas (SC, ST, OBC, General) and Divyangjan benefits.
* **Fit Compatibility Score:** Dynamic scoring engine weighing age fitness, income proximity, and category alignment.

### 4. Real-Time Government Web Scraper (`scripts/live_scraper.js`)
* **Direct DOM Extraction:** Uses **Cheerio** and **Axios** to fetch live HTML from official `.gov.in` and `.nic.in` domains.
* **Legacy SSL Resilience:** Custom `https.Agent` with `SSL_OP_LEGACY_SERVER_CONNECT` enabling seamless communication with legacy state government web servers.
* **In-Memory Cache (5-Minute TTL):** Caches live scrape results to minimize redundant external server hits and avoid rate limiting.
* **Live Telemetry:** Returns live HTTP latency (ms), HTTP status codes, parsed headings, official announcement marquees, and toll-free helplines.

### 5. Authoritative Admin Governance Console (`admin.html`, `admin.js`)
* **Human-in-the-Loop Safeguard:** Built for government administrators when automated scrapers break or when newly passed gazettes require immediate publication.
* **Secure Access:** Protected login requiring valid credentials (`admin@gov.in`).
* **Scheme Formulation & CRUD:** Formulate new schemes across **21 Welfare Categories**, **16 Target Occupations** (with quick-insert pills), and **9 Application Modes** (*Both, Online, Offline, CSC Center, Bank Branch, Gram Panchayat, Post Office, Mobile App, Other*).
* **Automated Institutional Gazette Dispatch:** Formulating or editing a scheme automatically generates a neutral official notification and syncs it to all matching citizen inboxes.
* **Citizen Database Oversight:** Search, filter, inspect demographic distributions, and export data in **CSV** or **JSON** formats.

### 6. Real-Time Gazette Notification Broadcast
* **Cross-Tab Synchronization:** Uses the browser `BroadcastChannel` API (`gov_nav_bulletins`) to sync gazette notices across open tabs instantly.
* **Persistent Notification Inbox:** Official bulletins are saved in `data/official_notifications.json` and mirrored in the citizen's profile.
* **Visual & Audio Cues:** Dynamic badge counters, slide-in toast notifications, and optional sound notifications.

### 7. Offline Assistance Locator
* **Digital Inclusion for Ground Reality:** Millions of rural citizens do not own desktop computers or printers.
* **Contextual Physical Center Discovery:** When a scheme requires offline submission (CSC, Bank, Panchayat, Post Office), GovNavigator AI automatically embeds an interactive **Google Maps** view targeting the closest facility within the citizen's selected district.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT BROWSER LAYER                                  │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│           CITIZEN PORTAL (index.html)     │         ADMIN PORTAL (admin.html)          │
│ • 6-Step Workflow Stepper                 │ • Protected Auth & Session Management      │
│ • Chatbot + Speech-to-Text (3 Languages)  │ • Multi-Dimensional Scheme Filter Bar      │
│ • Custom NLP Semantic Parser              │ • Scheme Formulation Modal (21 Categories) │
│ • Personalized Matched Schemes Dashboard  │ • 16 Target Occupations + Quick Pills      │
│ • Live Scraper Portal Verification Box    │ • 9 Application Delivery Modes             │
│ • Mock DigiLocker & AI Form Assistant     │ • Citizen Database Explorer (users.json)   │
│ • Real-Time Notification Center & Drawer  │ • CSV & JSON Data Export Engines           │
└─────────────────────┬─────────────────────┴───────────────────────┬────────────────────┘
                      │                                             │
                      ▼                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SERVER & BACKEND SERVICES                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Dual Execution Mode: Vite Internal Middleware Proxy OR Standalone Node.js Server     │
│ • Endpoints:                                                                           │
│   ├── /api/live-scheme          -> Live Web Scraper (Cheerio + Axios)                  │
│   ├── /api/users                -> Citizen Records & Scheme Allocations                │
│   ├── /api/users/sync           -> Sync Profile & Recalculated Entitlements            │
│   ├── /api/users/delete         -> Remove Citizen Account                              │
│   ├── /api/schemes/save         -> Policy Formulation & Auto-Gazette Dispatch          │
│   ├── /api/schemes/delete       -> Scheme Revocation Engine                            │
│   └── /api/notifications        -> Official Gazette Notifications Feed                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Atomic Data Stores:                                                                  │
│   ├── data/users.json                   (Citizen records, hashed passwords, matches)   │
│   ├── data/official_notifications.json  (Government bulletins & gazettes)              │
│   └── public/data/schemes.json          (Authoritative national schemes catalog)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Live Demo Credentials & Test Scenarios

### Admin Portal Credentials
Navigate to `/admin.html` (or click **🛡️ Admin Portal ↗** in the citizen sidebar):
| Field | Value |
| :--- | :--- |
| **Portal URL** | `http://localhost:5173/admin.html` |
| **Admin Email** | `admin@gov.in` |
| **Password** | `Admin@2026#GovNav` *(or `Admin@123!`)* |
| **Quick Action** | Click the **"Fill Demo Admin Credentials"** button on the login screen |

### Pre-Seeded Citizen Accounts
Test citizen authentication or review pre-calculated matching records:
| Persona | Email | Pre-Configured Profile Highlights |
| :--- | :--- | :--- |
| **Ramesh Patel** (Farmer) | `farmer@demo.gov` | Age 42, Male, Farmer, ₹1,80,000 income, Gujarat, OBC |
| **Pooja Verma** (Student) | `student@demo.gov` | Age 20, Female, Student, ₹1,20,000 income, Uttar Pradesh, SC |

### NLP Test Phrases (Try in Chatbot Step 2)
Select *"Others (Type Your Occupation)"* in the chatbot and try:
* *"I run a small tea stall on the pavement"* ➔ **Street Vendor / Micro-Enterprise** *(Matches PM SVANidhi, Mudra Loans)*
* *"I do daily construction work and repair houses"* ➔ **Daily Wager / Construction** *(Matches PM-SYM, Building Worker Welfare)*
* *"I drive an auto rickshaw in the city"* ➔ **Driver / Transport Worker**
* *"I have a small kirana grocery shop in the village"* ➔ **Small Merchant / Entrepreneur**

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js** v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
* **npm** v9.0.0 or higher (packaged with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/Rahul-N123456/my_project.git
cd my_project/MajorProject_B42
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server (Recommended)
This starts Vite 5 with built-in backend API middleware:
```bash
npm run dev
```
Open your browser and navigate to:
* **Citizen Portal:** `http://localhost:5173`
* **Admin Governance Console:** `http://localhost:5173/admin.html`

### 4. Alternative: Run the Standalone Node.js Server
If you prefer running a pure Node.js HTTP server:
```bash
npm run server
```
The server will start on `http://localhost:5173` (or the port defined in `PORT`).

### 5. Build for Production
To bundle and optimize frontend assets with Rollup and PostCSS:
```bash
npm run build
```
Production assets are generated in the `dist/` directory.

---

## 📡 REST API Reference

The server exposes lightweight JSON REST endpoints used by both the Citizen and Admin portals:

| Method | Endpoint | Description | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/live-scheme` | Scrapes an official government portal in real-time | `url` *(required)*, `name` *(optional)*, `refresh` *(boolean)* |
| `GET` | `/api/users` | Retrieves all registered citizens and their scheme matches | *None* |
| `POST` | `/api/users/sync` | Creates or updates a citizen profile & recalculates matches | `{ id, name, email, profile, eligibleSchemes }` |
| `POST` | `/api/users/delete` | Deletes a citizen account from the database | `{ email }` or `{ id }` |
| `POST` | `/api/schemes/save` | Creates or updates a welfare scheme & emits gazette alert | Full scheme object with eligibility criteria |
| `POST` | `/api/schemes/delete` | Revokes a welfare scheme from the national catalog | `{ id }` |
| `GET` | `/api/notifications` | Fetches all official gazette notices | *None* |
| `POST` | `/api/notifications` | Dispatches a new institutional gazette notice | `{ title, summary, category, date, level }` |

---

## 📂 Project Directory Structure

```
MajorProject_B42/
├── 📄 index.html                      # Citizen Discovery Portal UI & 6-step stepper
├── 📄 admin.html                      # Authoritative Admin Governance & Schemes Console
├── 🎨 style.css                       # Complete Vanilla CSS design system & animations
├── ⚡ main.js                         # Citizen controller, speech recognition & modals
├── 🛡️ admin.js                        # Admin controller, scheme CRUD, filters & exports
├── ⚙️ server.js                       # Standalone Node.js HTTP server & API endpoints
├── 🛠️ vite.config.js                  # Vite 5 dev server with integrated API middleware
├── 📦 package.json                    # Project dependencies (axios, cheerio) & scripts
├── 📑 PROJECT_TECHNICAL_REPORT.md     # In-depth architectural and technical report
│
├── 📁 js/                             # Client-Side Modular ES6+ Engines
│   ├── 🤖 chatbot.js                  # Conversational questionnaire controller
│   ├── 🧠 nlp.js                      # Semantic NLP entity parser & synonym mapper
│   ├── ⚖️ engine.js                   # Deterministic multi-attribute eligibility engine
│   ├── 🔐 auth.js                     # SHA-256 client authentication & validation
│   ├── 🔔 notifications.js            # BroadcastChannel listener, toasts & badge sync
│   └── 🌐 i18n.js                     # Trilingual translations (English, Hindi, Kannada)
│
├── 📁 scripts/                        # Server-Side Utilities & DB Handlers
│   ├── 🕷️ live_scraper.js             # Cheerio web scraper with legacy SSL support
│   ├── 📚 schemes_db.js               # Scheme catalog persistence & auto-gazette emitter
│   ├── 👥 user_db.js                  # Citizen database manager (data/users.json)
│   ├── 🔄 fetch_schemes.js            # Auxiliary batch scheme importer
│   └── 🔧 update_db_advanced.js       # Advanced database schema updater
│
├── 📁 data/                           # Atomic Persistent JSON Databases
│   ├── 👤 users.json                  # Citizen records, hashed credentials & matches
│   ├── 📰 official_notifications.json # Official government gazettes & bulletins
│   └── 📜 schemes.json                # Server-side backup copy of national catalog
│
└── 📁 public/
    └── 📁 data/
        └── 📜 schemes.json            # 56+ Authoritative national welfare schemes
```

---

## 💡 Key Innovations & Differentiators

1. **Dual NLP + Deterministic Rule Engine Synergy:** Statistical NLP is used exclusively for entity extraction and language understanding, while hard legal eligibility is calculated by deterministic code. This eliminates the hallucination risks common in pure LLM setups.
2. **True Human-in-the-Loop Governance:** When government web portals change their markup or servers experience downtime, administrators can formulate or adjust scheme criteria in seconds, instantly syncing changes to all affected citizen accounts.
3. **Inclusive Super-Senior & Centenary Support:** The age parameter spans **0 to 125 years**, enabling the platform to cater to both infant nutrition programs (e.g., POSHAN Abhiyaan) and centenarian pension funds.
4. **Resilience to Legacy Government Infrastructure:** The integrated scraper utilizes custom cryptographic options (`SSL_OP_LEGACY_SERVER_CONNECT`) specifically designed to negotiate handshakes with legacy NIC servers that fail in modern browsers.
5. **Completely Local & Zero API Bill:** No OpenAI, Google Cloud, or AWS bills. Everything from speech recognition to scraping and database persistence runs on standard web APIs and lightweight Node.js.

---

## 🔮 Future Roadmap

- [ ] **Aadhaar / DigiLocker OAuth2 Integration:** Direct government KYC pull for instantaneous zero-input profile formulation.
- [ ] **Multimodal OCR Document Verification:** On-device camera capture for ration cards, income certificates, and disability cards.
- [ ] **Interactive IVR / Telephony Gateway:** Voice-driven SMS and IVR phone line for feature phone users without internet access.
- [ ] **Direct UMANG Portal API Bridge:** Seamless one-click scheme submission into central ministry backends.

---

## 📜 License & Acknowledgments

* **Project:** Developed for the **Infathon Hackathon**.
* **License:** [MIT License](LICENSE) — Open for government, public benefit, and educational enhancement.
* **National Portal Data:** Scheme information referenced from [MyScheme.gov.in](https://www.myscheme.gov.in) and official ministry gazettes.

---

<p align="center">
  <b>Built with ❤️ for Indian Citizens • Empowering Every Household with Transparent Governance</b>
</p>
