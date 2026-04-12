export const matchSchemes = (userProfile, schemesList) => {
    return schemesList.filter(scheme => {
        const { eligibility } = scheme;

        if (eligibility.gender && !eligibility.gender.includes(userProfile.gender)) return false;
        if (eligibility.minAge !== undefined && userProfile.age < eligibility.minAge) return false;
        if (eligibility.maxAge !== undefined && userProfile.age > eligibility.maxAge) return false;
        if (eligibility.occupation && !eligibility.occupation.includes(userProfile.occupation)) return false;
        if (eligibility.maxIncome && userProfile.income > eligibility.maxIncome) return false;

        // Match Location
        if (eligibility.location && eligibility.location !== "Central") {
            if (eligibility.location !== userProfile.location) return false;
        }

        if (eligibility.caste && !eligibility.caste.includes(userProfile.caste)) return false;
        if (eligibility.area && !eligibility.area.includes(userProfile.area)) return false;
        if (eligibility.disabledOnly && userProfile.disabled === "No") return false;

        return true;
    });
};

export const searchByKeyword = (schemes, query) => {
    if (!query) return schemes;
    const q = query.toLowerCase();
    return schemes.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
};
