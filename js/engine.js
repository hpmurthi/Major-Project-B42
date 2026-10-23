import { calculateRecommendationScore } from './nlp.js';

export const matchSchemes = (userProfile, schemesList) => {
    if (!userProfile || !Array.isArray(schemesList)) return [];

    return schemesList.filter(scheme => {
        const { eligibility } = scheme;
        if (!eligibility) return true;

        if (eligibility.gender && !eligibility.gender.includes(userProfile.gender)) return false;

        // Age limits: accurately supports 0 to 125 years
        if (eligibility.minAge !== undefined && userProfile.age < eligibility.minAge) return false;
        if (eligibility.maxAge !== undefined && userProfile.age > eligibility.maxAge) return false;

        // Occupation Matching with NLP Multi-Role Semantic Expansion
        // e.g. "I own a food stall" maps to Street Vendor + Entrepreneur + Small Scale
        if (eligibility.occupation && eligibility.occupation.length > 0) {
            const userOcc = userProfile.occupation;
            const secondaryRoles = userProfile.nlpResult?.secondaryRoles || [];
            const candidateRoles = [userOcc, ...secondaryRoles].filter(Boolean).map(r => r.toLowerCase());
            
            const isUniversal = eligibility.occupation.some(occ => occ === 'All' || occ === 'Any' || occ === 'Other');
            const hasOccupationMatch = isUniversal || eligibility.occupation.some(occ => 
                candidateRoles.includes(occ.toLowerCase()) || 
                candidateRoles.some(cr => cr.includes(occ.toLowerCase()) || occ.toLowerCase().includes(cr))
            );
            if (!hasOccupationMatch) return false;
        }

        if (eligibility.maxIncome && userProfile.income > eligibility.maxIncome) return false;

        // Match Location
        if (eligibility.location && eligibility.location !== "Central") {
            if (eligibility.location !== userProfile.location) return false;
        }

        if (eligibility.caste && !eligibility.caste.includes(userProfile.caste)) return false;
        if (eligibility.area && !eligibility.area.includes(userProfile.area)) return false;
        if (eligibility.disabledOnly && userProfile.disabled === "No") return false;

        return true;
    }).map(scheme => {
        // Step 4 of Workflow: Generate intelligent recommendation fit score (0-100%)
        const rec = calculateRecommendationScore(scheme, userProfile);
        return {
            ...scheme,
            matchScore: rec.score,
            recommendationBadge: rec.badge,
            highlightReason: rec.highlightReason
        };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)); // Rank highest recommendation first!
};

export const searchByKeyword = (schemes, query) => {
    if (!query) return schemes;
    const q = query.toLowerCase();
    return schemes.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.highlightReason && s.highlightReason.toLowerCase().includes(q))
    );
};
