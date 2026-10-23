import axios from 'axios';
import https from 'https';
import crypto from 'crypto';
import * as cheerio from 'cheerio';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT // Essential for legacy NIC / state government SSL servers
});

// In-memory cache for live scraped results (5 minute TTL)
const liveCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Scrapes and extracts live information directly from an official government portal.
 * @param {string} url - Official government scheme URL
 * @param {string} schemeName - Scheme name for context/fallback
 * @param {boolean} forceRefresh - If true, bypasses the in-memory cache
 */
export async function scrapeLiveGovScheme(url, schemeName = '', forceRefresh = false) {
    if (!url || typeof url !== 'string') {
        return { success: false, errorMessage: 'Invalid or missing URL.' };
    }

    const cacheKey = url.trim().toLowerCase();
    const cached = liveCache.get(cacheKey);
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        console.log(`[LiveScraper] Returning cached live data for ${url}`);
        return { ...cached.data, fromCache: true };
    }

    const startTime = Date.now();
    let domain = '';
    try {
        domain = new URL(url).hostname;
    } catch (_) {
        domain = url;
    }

    try {
        console.log(`[LiveScraper] Contacting official portal in real-time: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB,en;q=0.9,hi;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            httpsAgent,
            timeout: 12000,
            maxRedirects: 5
        });

        const latency = Date.now() - startTime;
        const html = response.data;
        const $ = cheerio.load(html);

        // Strip non-content tags
        $('script, style, noscript, svg, iframe').remove();

        const title = $('title').text().replace(/\s+/g, ' ').trim();
        const metaDesc = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';

        // 1. Live Announcements / Notifications / Marquee tickers
        const announcements = [];
        $('marquee, .marquee, .alert, .notification, .ticker, .announcement, .latest-update, .news-ticker, .news, .updates').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 20 && text.length < 300 && !announcements.includes(text)) {
                announcements.push(text);
            }
        });

        // 2. Live Eligibility information
        const liveEligibility = [];
        const eligibilityKeywords = ['eligib', 'who can apply', 'criteria', 'patrata', 'guidelines', 'beneficiar'];
        
        $('h1, h2, h3, h4, h5, strong, b, dt').each((_, el) => {
            const headingText = $(el).text().trim().toLowerCase();
            if (eligibilityKeywords.some(kw => headingText.includes(kw))) {
                const nextUl = $(el).next('ul, ol');
                if (nextUl.length) {
                    nextUl.find('li').each((_, li) => {
                        const item = $(li).text().replace(/\s+/g, ' ').trim();
                        if (item.length > 10 && item.length < 250 && !liveEligibility.includes(item)) {
                            liveEligibility.push(item);
                        }
                    });
                } else {
                    const nextP = $(el).next('p, dd');
                    if (nextP.length) {
                        const pText = nextP.text().replace(/\s+/g, ' ').trim();
                        if (pText.length > 15 && pText.length < 350 && !liveEligibility.includes(pText)) {
                            liveEligibility.push(pText);
                        }
                    }
                }
            }
        });

        // 3. Live Benefits & financial assistance mentions
        const liveBenefits = [];
        $('p, li').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (
                (text.includes('₹') || text.includes('Rs.') || text.includes('Rs ') || /subsid/i.test(text) || /financial assistance/i.test(text) || /incentive/i.test(text)) &&
                text.length > 15 && text.length < 250 &&
                !liveBenefits.includes(text)
            ) {
                if (liveBenefits.length < 5) liveBenefits.push(text);
            }
        });

        // 4. Helplines & Contact info
        const helplines = [];
        const bodyText = $('body').text().replace(/\s+/g, ' ');
        const phoneRegex = /(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|011[-\s]?[0-9]{7,8}|\+91[-\s]?[0-9]{10}|(?:helpline|toll free|call center)[:\s]+[0-9\-\s]{8,15})/gi;
        const phoneMatches = bodyText.match(phoneRegex);
        if (phoneMatches) {
            phoneMatches.slice(0, 3).forEach(m => {
                const cleaned = m.trim();
                if (!helplines.includes(cleaned)) helplines.push(cleaned);
            });
        }

        // 5. Detected documents mentioned on the live page
        const docKeywords = [
            'Aadhaar Card', 'Income Certificate', 'Caste Certificate', 'Ration Card', 
            'Bank Account', 'Land Records (RTC)', 'Passport Photo', 'PAN Card', 
            'Voter ID', 'Domicile Certificate', 'Birth Certificate'
        ];
        const detectedDocuments = [];
        docKeywords.forEach(doc => {
            const baseTerm = doc.split(' ')[0];
            const regex = new RegExp(`\\b${baseTerm}\\b`, 'i');
            if (regex.test(bodyText) && !detectedDocuments.includes(doc)) {
                detectedDocuments.push(doc);
            }
        });

        const liveData = {
            success: true,
            source: 'live_gov_portal',
            url,
            domain,
            pageTitle: title || schemeName,
            metaDescription: metaDesc,
            latencyMs: latency,
            httpStatus: response.status,
            isLive: true,
            fetchedAt: new Date().toLocaleTimeString(),
            announcements: announcements.slice(0, 3),
            liveEligibility: liveEligibility.slice(0, 5),
            liveBenefits: liveBenefits.slice(0, 4),
            helplines,
            detectedDocuments
        };

        // Cache successful response
        liveCache.set(cacheKey, { timestamp: Date.now(), data: liveData });
        return liveData;

    } catch (err) {
        console.error(`[LiveScraper Error] Could not reach ${url}:`, err.message);

        return {
            success: false,
            source: 'live_gov_portal_error',
            url,
            domain,
            pageTitle: schemeName,
            latencyMs: Date.now() - startTime,
            httpStatus: err.response?.status || 503,
            isLive: false,
            errorMessage: err.message.includes('timeout') ? 'Official portal response timed out.' : err.message,
            fetchedAt: new Date().toLocaleTimeString()
        };
    }
}
