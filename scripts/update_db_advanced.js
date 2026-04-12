import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMES_FILE = path.join(__dirname, '../public/data/schemes.json');

const raw = fs.readFileSync(SCHEMES_FILE, 'utf-8');
const schemes = JSON.parse(raw);

schemes.forEach(scheme => {
    const text = (scheme.category + " " + scheme.name + " " + scheme.description).toLowerCase();
    
    // Default assignments
    if (!scheme.eligibility.caste) scheme.eligibility.caste = ["General", "OBC", "SC", "ST"];
    if (!scheme.eligibility.area) scheme.eligibility.area = ["Rural", "Urban"];
    if (!scheme.eligibility.occupation) scheme.eligibility.occupation = ["Student", "Farmer", "Entrepreneur", "Street Vendor", "Artisan", "Daily Wager", "Employed", "Unemployed", "None"];
    if (scheme.eligibility.disabledOnly === undefined) scheme.eligibility.disabledOnly = false;
    if (scheme.eligibility.minAge === undefined) scheme.eligibility.minAge = 0;
    if (scheme.eligibility.maxAge === undefined) scheme.eligibility.maxAge = 120;

    // Caste heuristics
    if (text.includes("sc/st") || text.includes("backward class") || text.includes("caste")) {
        scheme.eligibility.caste = ["SC", "ST", "OBC"];
    }

    // Area heuristics
    if (text.includes("rural") || text.includes("gramin") || text.includes("village")) {
        scheme.eligibility.area = ["Rural"];
    } else if (text.includes("urban")) {
        scheme.eligibility.area = ["Urban"];
    }

    // Occupation heuristics
    if (text.includes("student") || text.includes("education") || text.includes("scholarship")) {
        scheme.eligibility.occupation = ["Student"];
    } else if (text.includes("farmer") || text.includes("agriculture") || text.includes("crop")) {
        scheme.eligibility.occupation = ["Farmer", "Daily Wager"];
    } else if (text.includes("artisan") || text.includes("weaver") || text.includes("handloom") || text.includes("craft")) {
        scheme.eligibility.occupation = ["Artisan", "Entrepreneur", "Daily Wager"];
    } else if (text.includes("street vendor") || text.includes("svanidhi") || text.includes("hawker")) {
        scheme.eligibility.occupation = ["Street Vendor", "Entrepreneur"];
    } else if (text.includes("business") || text.includes("loan") || text.includes("entrepreneur") || text.includes("startup")) {
        scheme.eligibility.occupation = ["Entrepreneur"];
    }

    // Age heuristics
    if (text.includes("senior citizen") || text.includes("old age")) scheme.eligibility.minAge = 60;
    else if (text.includes("girl child") || text.includes("student")) { scheme.eligibility.minAge = 0; }
    else scheme.eligibility.minAge = 18; // generic adult scheme
});

fs.writeFileSync(SCHEMES_FILE, JSON.stringify(schemes, null, 2));
console.log("Database augmented with advanced eligibility fields!");
