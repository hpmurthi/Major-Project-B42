/**
 * GovNavigator AI - Natural Language Processing (NLP) Engine
 * 
 * Provides:
 * 1. Semantic Occupation Understanding (e.g. "I own a food stall" -> "Small Scale / Street Vendor / Entrepreneur")
 * 2. Freeform Entity Extraction (Age limit 0-125, Income, Gender, Location)
 * 3. Intelligent Recommendation Ranking & Scoring (Workflow Step 4)
 */

// Canonical occupations recognized by government scheme eligibility engines
export const CANONICAL_OCCUPATIONS = [
    "Student",
    "Farmer",
    "Entrepreneur",
    "Street Vendor",
    "Artisan",
    "Daily Wager",
    "Employed",
    "Unemployed",
    "None"
];

// NLP Knowledge Base of Synonyms, Intents & Semantic Mappings
const OCCUPATION_INTENTS = [
    {
        canonical: "Street Vendor",
        secondary: ["Entrepreneur", "Daily Wager"],
        isSmallScale: true,
        displayName: "Small Scale Merchant / Street Vendor",
        keywords: [
            "food stall", "tea stall", "chai", "thela", "hawker", "vendor", "street vendor",
            "pushcart", "food cart", "rehdri", "pavement", "roadside", "stall", "tiffin",
            "snack center", "fast food stall", "chaat", "panipuri", "vegetable seller",
            "fruit seller", "flower vendor", "kiosk", "footpath", "cart owner", "street"
        ],
        explanation: "Understood as Small Scale Food Stall / Street Merchant (Eligible for PM SVANidhi, Micro-Credit & Mudra Schemes)"
    },
    {
        canonical: "Entrepreneur",
        secondary: ["Street Vendor"],
        isSmallScale: true,
        displayName: "Micro / Small Scale Business Owner",
        keywords: [
            "own business", "shop", "shopkeeper", "store", "kirana", "retailer", "merchant",
            "boutique", "grocery", "trader", "agency", "small scale", "startup", "venture",
            "micro enterprise", "msme", "workshop", "enterprise", "proprietor", "self employed",
            "parlour", "salon", "bakery", "cafe", "cyber cafe", "photocopy", "small business"
        ],
        explanation: "Understood as Micro / Small Business Entrepreneur (Eligible for PMEGP, Mudra Loans & Stand-Up India)"
    },
    {
        canonical: "Farmer",
        secondary: ["Daily Wager"],
        isSmallScale: false,
        displayName: "Agricultural Cultivator / Farmer",
        keywords: [
            "farmer", "farming", "agriculture", "cultivator", "kisan", "crop", "landowner",
            "tenant farmer", "grow vegetables", "horticulture", "dairy farming", "poultry",
            "cattle", "pashupalan", "organic farm", "irrigation", "tiller", "sericulture", "fisheries"
        ],
        explanation: "Understood as Agricultural Farmer / Cultivator (Eligible for PM-KISAN, PMFBY & Agri Infra Fund)"
    },
    {
        canonical: "Artisan",
        secondary: ["Entrepreneur"],
        isSmallScale: true,
        displayName: "Traditional Artisan / Craftsman",
        keywords: [
            "artisan", "craft", "handicraft", "carpenter", "blacksmith", "goldsmith", "potter",
            "weaver", "handloom", "tailor", "sewing", "embroidery", "sculptor", "murtikar",
            "leather worker", "cobbler", "barber", "washerman", "dhobi", "darzi", "vishwakarma", "mason"
        ],
        explanation: "Understood as Skilled Artisan / Craftsman (Eligible for PM Vishwakarma & Mudra Schemes)"
    },
    {
        canonical: "Daily Wager",
        secondary: ["Street Vendor"],
        isSmallScale: true,
        displayName: "Daily Wage / Unorganized Laborer",
        keywords: [
            "daily wage", "daily wager", "labor", "labour", "mazdoor", "construction worker",
            "helper", "loader", "coolie", "porter", "painter", "plumber", "electrician",
            "cleaner", "sweeper", "maid", "domestic help", "driver", "rickshaw", "auto driver",
            "cab driver", "delivery boy", "delivery partner", "swiggy", "zomato", "gig worker"
        ],
        explanation: "Understood as Daily Wager / Gig Worker (Eligible for e-Shram, PM-SYM & Welfare Boards)"
    },
    {
        canonical: "Student",
        secondary: ["Unemployed"],
        isSmallScale: false,
        displayName: "Student / Scholar",
        keywords: [
            "student", "studying", "college", "school", "university", "graduate", "post graduate",
            "degree", "diploma", "engineering", "medical", "coaching", "upsc", "competitive exam",
            "phd", "researcher", "scholar", "undergrad", "class 10", "class 12", "learner"
        ],
        explanation: "Understood as Student / Scholar (Eligible for Post-Matric Scholarships, Free Coaching & Fellowship Schemes)"
    },
    {
        canonical: "Employed",
        secondary: [],
        isSmallScale: false,
        displayName: "Salaried / Employed Professional",
        keywords: [
            "job", "employed", "salaried", "private company", "software", "it professional",
            "engineer", "manager", "accountant", "clerk", "teacher", "professor", "nurse",
            "technician", "staff", "corporate", "firm", "monthly salary", "working in"
        ],
        explanation: "Understood as Salaried / Formal Employee (Eligible for EPF, ESIC & Central Housing Schemes)"
    },
    {
        canonical: "Unemployed",
        secondary: ["None"],
        isSmallScale: false,
        displayName: "Job Seeker / Unemployed",
        keywords: [
            "unemployed", "no job", "looking for job", "searching work", "jobless", "fresh graduate",
            "laid off", "seeking employment", "career break", "fresher"
        ],
        explanation: "Understood as Job Seeker (Eligible for PMKVY Skill India, Employment Exchanges & Youth Stipends)"
    },
    {
        canonical: "Entrepreneur",
        secondary: ["None"],
        isSmallScale: true,
        displayName: "Homemaker / Aspiring Entrepreneur",
        keywords: [
            "homemaker", "housewife", "stay at home", "home maker", "shg", "self help group",
            "mahila", "pickle making", "papad", "handicraft at home"
        ],
        explanation: "Understood as Homemaker / SHG Entrepreneur (Eligible for Women Entrepreneurship & Lakhpati Didi)"
    }
];

/**
 * Process freeform natural language text for occupation.
 * Maps inputs like "I own a food stall" -> "Street Vendor" + "Small Scale" + "Entrepreneur"
 * 
 * @param {string} text - Raw natural language input from citizen
 * @returns {object} NLP result with canonical mapping, tags, and explanation
 */
export function processOccupationNLP(text) {
    if (!text || typeof text !== 'string') {
        return {
            raw: '',
            canonical: 'None',
            secondaryRoles: [],
            isSmallScale: false,
            displayName: 'General Citizen',
            tags: [],
            confidence: 0,
            explanation: 'Standard demographic matching applied.'
        };
    }

    const cleaned = text.trim();
    const lower = cleaned.toLowerCase();

    // 1. Direct Canonical exact match check
    for (const canonical of CANONICAL_OCCUPATIONS) {
        if (lower === canonical.toLowerCase()) {
            return {
                raw: cleaned,
                canonical: canonical,
                secondaryRoles: canonical === 'Street Vendor' ? ['Entrepreneur'] : (canonical === 'Artisan' ? ['Entrepreneur'] : []),
                isSmallScale: canonical === 'Street Vendor' || canonical === 'Artisan',
                displayName: canonical,
                tags: [canonical.toLowerCase(), (canonical === 'Street Vendor' || canonical === 'Artisan') ? 'small scale' : ''],
                confidence: 1.0,
                explanation: `Exact match for ${canonical}.`
            };
        }
    }

    // 2. Keyword & Intent Scoring
    let bestMatch = null;
    let highestScore = 0;
    const matchedKeywords = [];

    for (const intent of OCCUPATION_INTENTS) {
        let score = 0;
        const matched = [];

        for (const kw of intent.keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            if (regex.test(lower)) {
                score += kw.includes(' ') ? 4 : 2;
                matched.push(kw);
            } else if (lower.includes(kw)) {
                score += 1;
                matched.push(kw);
            }
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = intent;
            matchedKeywords.length = 0;
            matchedKeywords.push(...matched);
        }
    }

    // 3. If a semantic match was found
    if (bestMatch && highestScore > 0) {
        const tags = [
            bestMatch.canonical.toLowerCase(),
            ...(bestMatch.secondary || []).map(s => s.toLowerCase()),
            ...(bestMatch.isSmallScale ? ['small scale', 'micro enterprise'] : []),
            ...matchedKeywords
        ];

        return {
            raw: cleaned,
            canonical: bestMatch.canonical,
            secondaryRoles: bestMatch.secondary || [],
            isSmallScale: bestMatch.isSmallScale,
            displayName: bestMatch.displayName,
            tags: [...new Set(tags.filter(Boolean))],
            confidence: Math.min(0.98, 0.70 + (highestScore * 0.05)),
            explanation: bestMatch.explanation
        };
    }

    // 4. Fallback heuristic detection: check if words like "sell", "business", "work", "shop" exist
    const isSmallScaleHeuristic = /stall|shop|sell|vendor|merchant|earn|small|thela|handicraft|food/i.test(lower);
    const isStudentHeuristic = /study|learn|college|exam|class/i.test(lower);
    const isAgriHeuristic = /farm|crop|khet|land|cow|buffalo/i.test(lower);

    if (isSmallScaleHeuristic) {
        return {
            raw: cleaned,
            canonical: "Street Vendor",
            secondaryRoles: ["Entrepreneur"],
            isSmallScale: true,
            displayName: "Small Scale Merchant / Vendor",
            tags: ["small scale", "street vendor", "entrepreneur", "merchant"],
            confidence: 0.75,
            explanation: `NLP identified commercial activity from "${cleaned}". Mapped to Small Scale Merchant & Vendor.`
        };
    } else if (isStudentHeuristic) {
        return {
            raw: cleaned,
            canonical: "Student",
            secondaryRoles: [],
            isSmallScale: false,
            displayName: "Student",
            tags: ["student", "education"],
            confidence: 0.78,
            explanation: `NLP identified educational terms from "${cleaned}". Mapped to Student.`
        };
    } else if (isAgriHeuristic) {
        return {
            raw: cleaned,
            canonical: "Farmer",
            secondaryRoles: ["Daily Wager"],
            isSmallScale: false,
            displayName: "Agricultural Farmer",
            tags: ["farmer", "agriculture"],
            confidence: 0.80,
            explanation: `NLP identified farming references from "${cleaned}". Mapped to Farmer.`
        };
    }

    // Default general citizen
    return {
        raw: cleaned,
        canonical: "None",
        secondaryRoles: ["Daily Wager", "Entrepreneur"],
        isSmallScale: false,
        displayName: cleaned,
        tags: ["citizen", cleaned.toLowerCase()],
        confidence: 0.65,
        explanation: `Custom profile "${cleaned}" recognized. Applying broad citizen welfare scheme rules.`
    };
}

/**
 * Parses freeform natural language text to extract demographic numbers like Age and Income.
 * e.g., "I am 26 years old and my family income is 1.5 lakhs"
 */
export function extractDemographicsNLP(text) {
    if (!text || typeof text !== 'string') return {};
    const lower = text.toLowerCase();
    const result = {};

    // 1. Age extraction (range 0 to 125)
    const ageMatch = lower.match(/\b(?:age|aged|am|is|turning)?\s*(\d{1,3})\s*(?:years|yrs|yo|age)?\b/);
    if (ageMatch) {
        const val = parseInt(ageMatch[1], 10);
        if (!isNaN(val) && val >= 0 && val <= 125) {
            result.age = val;
        }
    }

    // 2. Income extraction
    const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|lpa)\b/);
    if (lakhMatch) {
        result.income = Math.round(parseFloat(lakhMatch[1]) * 100000);
    } else {
        const monthlyMatch = lower.match(/(?:rs\.?|₹)?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:per\s*month|\/month|pm)\b/);
        if (monthlyMatch) {
            const mVal = parseInt(monthlyMatch[1].replace(/,/g, ''), 10);
            if (!isNaN(mVal)) result.income = mVal * 12;
        } else {
            const rawNumber = lower.match(/(?:rs\.?|₹|income)?\s*(\d{4,8})\b/);
            if (rawNumber) {
                const iVal = parseInt(rawNumber[1], 10);
                if (!isNaN(iVal)) result.income = iVal;
            }
        }
    }

    // 3. Gender extraction
    if (/\b(?:female|woman|girl|lady|she|her)\b/.test(lower)) {
        result.gender = "Female";
    } else if (/\b(?:male|man|boy|he|him|gentleman)\b/.test(lower)) {
        result.gender = "Male";
    }

    return result;
}

/**
 * Intelligent Recommendation Ranking Algorithm
 * Workflow Step 4: Generates a 0-100% Match Score and specific justification badge.
 * 
 * @param {object} scheme - Scheme object from catalog
 * @param {object} profile - Citizen profile enriched with NLP tags
 * @returns {object} { score: number, badge: string, highlightReason: string }
 */
export function calculateRecommendationScore(scheme, profile) {
    if (!scheme || !profile) return { score: 75, badge: "Eligible", highlightReason: "" };

    let score = 70; // Base score for passing eligibility rules
    const reasons = [];

    const nlp = profile.nlpResult || {};
    const isSmallScale = nlp.isSmallScale || profile.occupation === 'Street Vendor';

    // 1. Occupation Match Bonus
    const schemeOcc = scheme.eligibility?.occupation || [];
    if (schemeOcc.includes(profile.occupation)) {
        score += 15;
        reasons.push(`Direct fit for ${profile.occupation}`);
    } else if (nlp.secondaryRoles && nlp.secondaryRoles.some(r => schemeOcc.includes(r))) {
        score += 12;
        reasons.push(`Matches your small-scale merchant status`);
    }

    // 2. Small Scale / Street Vendor bonus for targeted schemes (PM SVANidhi, Mudra, PMEGP)
    const schemeText = (scheme.name + " " + scheme.description + " " + (scheme.category || '')).toLowerCase();
    if (isSmallScale && (schemeText.includes('vendor') || schemeText.includes('svanidhi') || schemeText.includes('mudra') || schemeText.includes('micro') || schemeText.includes('credit'))) {
        score += 12;
        reasons.push(`Priority Scheme for Small Scale Vendors`);
    }

    // 3. Demographic Alignment
    if (scheme.eligibility?.gender && scheme.eligibility.gender.length === 1 && scheme.eligibility.gender.includes(profile.gender)) {
        score += 8;
        reasons.push(`Specifically tailored for ${profile.gender} citizens`);
    }

    if (profile.age >= 60 && schemeText.includes('pension')) {
        score += 8;
        reasons.push(`Senior citizen pension priority`);
    }

    if (profile.age <= 25 && profile.occupation === 'Student' && schemeText.includes('scholarship')) {
        score += 10;
        reasons.push(`Student scholarship match`);
    }

    // 4. Low income empowerment
    if (profile.income && profile.income <= 250000 && scheme.eligibility?.maxIncome) {
        score += 6;
        reasons.push(`Income criteria priority`);
    }

    // Cap at 99%
    score = Math.min(99, Math.max(72, score));

    // Badge styling
    let badge = `${score}% Match`;
    if (score >= 95) badge = `⭐ ${score}% Top Recommendation`;
    else if (score >= 90) badge = `🎯 ${score}% Highly Recommended`;
    else if (score >= 80) badge = `✨ ${score}% Strong Match`;

    return {
        score,
        badge,
        highlightReason: reasons[0] || 'Eligible based on your verified criteria'
    };
}
