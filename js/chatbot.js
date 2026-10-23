import { t } from './i18n.js';
import { processOccupationNLP, extractDemographicsNLP } from './nlp.js';

export class Chatbot {
    constructor(onComplete) {
        this.step = 0;
        this.onComplete = onComplete;
        this.profile = { 
            gender: '', 
            age: 0, 
            occupation: '', 
            occupationRaw: '',
            nlpResult: null,
            income: 0, 
            location: '', 
            district: '', 
            disabled: '', 
            caste: '', 
            area: '' 
        };
        this.indianStates = [
            "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", 
            "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
            "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
            "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
            "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        this.questions = [
            { field: 'gender', options: ["Female", "Male", "Other"] },
            { 
                field: 'age', 
                type: 'number', 
                min: 0, 
                max: 125, 
                placeholder: "Enter age in years (0 - 125)",
                helperText: "Valid age range: 0 (newborn) to 125 years"
            },
            { 
                field: 'occupation', 
                options: [
                    "Student", 
                    "Farmer", 
                    "Entrepreneur", 
                    "Street Vendor", 
                    "Artisan", 
                    "Daily Wager", 
                    "Employed", 
                    "Unemployed", 
                    "Others (Type Your Occupation)"
                ],
                supportsNLP: true
            },
            { 
                field: 'income', 
                type: 'number',
                placeholder: "Annual family income in ₹ (e.g. 150000)" 
            },
            { field: 'location', options: this.indianStates },
            { field: 'district', placeholder: "Your District or City (e.g. Mysore, Pune)" },
            { field: 'disabled', options: ["Yes", "No"] },
            { field: 'caste', options: ["General", "OBC", "SC", "ST"] },
            { field: 'area', options: ["Rural", "Urban"] }
        ];
    }

    getNext() {
        if (this.step >= this.questions.length) {
            this.onComplete(this.profile);
            return { text: "NLP processing complete. Matching you with eligible government schemes...", done: true };
        }
        const q = this.questions[this.step];
        return {
            text: t(q.field),
            options: q.options,
            field: q.field,
            type: q.type || 'text',
            min: q.min,
            max: q.max,
            placeholder: q.placeholder,
            helperText: q.helperText,
            supportsNLP: q.supportsNLP,
            done: false
        };
    }

    answer(val) {
        const q = this.questions[this.step];
        const currentField = q.field;

        // Validation for Age (0 to 125 years limit)
        if (currentField === 'age') {
            // Also attempt NLP demographic extraction if user typed "I am 25 years old"
            const nlpDemo = extractDemographicsNLP(String(val));
            const num = (nlpDemo.age !== undefined) ? nlpDemo.age : parseInt(val, 10);

            if (isNaN(num) || num < 0 || num > 125) {
                return {
                    text: "⚠️ Please enter a valid age between 0 and 125 years. (e.g., '0' for infants or '28' for adults)",
                    options: null,
                    field: 'age',
                    type: 'number',
                    min: 0,
                    max: 125,
                    placeholder: "Enter age (0 - 125)",
                    isRetry: true,
                    done: false
                };
            }
            this.profile.age = num;
            this.step++;
            return this.getNext();
        }

        // Processing for Occupation (with NLP semantic understanding)
        if (currentField === 'occupation') {
            const nlp = processOccupationNLP(String(val));
            this.profile.occupation = nlp.canonical;
            this.profile.occupationRaw = String(val);
            this.profile.nlpResult = nlp;
            this.step++;

            const nextQ = this.getNext();
            // Attach NLP feedback so UI can display live recognition badge
            return {
                ...nextQ,
                nlpInsight: {
                    input: String(val),
                    canonical: nlp.canonical,
                    displayName: nlp.displayName,
                    isSmallScale: nlp.isSmallScale,
                    explanation: nlp.explanation,
                    confidence: nlp.confidence,
                    tags: nlp.tags
                }
            };
        }

        // Processing for Income
        if (currentField === 'income') {
            const nlpDemo = extractDemographicsNLP(String(val));
            const inc = (nlpDemo.income !== undefined) ? nlpDemo.income : (parseInt(String(val).replace(/,/g, ''), 10) || 0);
            this.profile.income = Math.max(0, inc);
            this.step++;
            return this.getNext();
        }

        this.profile[currentField] = val;
        this.step++;
        return this.getNext();
    }
}
