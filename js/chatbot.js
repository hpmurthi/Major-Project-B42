import { t } from './i18n.js';

export class Chatbot {
    constructor(onComplete) {
        this.step = 0;
        this.onComplete = onComplete;
        this.profile = { gender: '', age: 0, occupation: '', income: 0, location: '', district: '', disabled: '', caste: '', area: '' };
        this.indianStates = [
            "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", 
            "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
            "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
            "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
            "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        this.questions = [
            { field: 'gender', options: ["Female", "Male", "Other"] },
            { field: 'age' },
            { field: 'occupation', options: ["Student", "Farmer", "Entrepreneur", "Street Vendor", "Artisan", "Daily Wager", "Employed", "Unemployed", "None"] },
            { field: 'income' },
            { field: 'location', options: this.indianStates },
            { field: 'district' },
            { field: 'disabled', options: ["Yes", "No"] },
            { field: 'caste', options: ["General", "OBC", "SC", "ST"] },
            { field: 'area', options: ["Rural", "Urban"] }
        ];
    }

    getNext() {
        if (this.step >= this.questions.length) {
            this.onComplete(this.profile);
            return { text: "Matching you with schemes...", done: true };
        }
        const q = this.questions[this.step];
        return {
            text: t(q.field),
            options: q.options,
            field: q.field,
            done: false
        };
    }

    answer(val) {
        const currentField = this.questions[this.step].field;
        this.profile[currentField] = (currentField === 'income' || currentField === 'age') ? parseInt(val) || 0 : val;
        this.step++;
        return this.getNext();
    }
}
