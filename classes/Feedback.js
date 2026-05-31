class Feedback {
    #id;
    #subject;
    #message;
    #ratings; // object: { forum, quiz, firstAid, login, map }
    #dateSubmitted;

    constructor(subject = '', message = '', ratings = {}, dateSubmitted = new Date(), id = null) {
        this.#id = id || `fb_${Date.now()}`;
        this.#subject = subject;
        this.#message = message;
        this.#ratings = Object.assign({ forum: null, quiz: null, firstAid: null, login: null, map: null }, ratings);
        this.#dateSubmitted = (dateSubmitted instanceof Date) ? dateSubmitted : new Date(dateSubmitted);
    }


    // Validate inputs per simple rules: at least one rating or message provided; ratings must be 1-10 when present
    validateInput() {
        const errors = [];
        const hasRating = Object.values(this.#ratings).some(v => typeof v === 'number' && !Number.isNaN(v));
        const hasMessage = typeof this.#message === 'string' && this.#message.trim().length > 0;

        if (!hasRating && !hasMessage) {
            errors.push('Provide at least one rating or a message.');
        }

        Object.entries(this.#ratings).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            const num = Number(v);
            if (Number.isNaN(num) || num < 1 || num > 10) {
                errors.push(`${k} rating must be a number between 1 and 10.`);
            }
        });
        

        return { valid: errors.length === 0, errors };
    }

    toJSON() {
        return {
            id: this.#id,
            subject: this.#subject,
            message: this.#message,
            ratings: Object.assign({}, this.#ratings),
            submitted_at: this.#dateSubmitted.toISOString()
        };
    }

    View() {
        // Format rating labels (firstAid -> First Aid, etc.)
        const niceLabel = (key) => {
            if (key === 'firstAid') return 'First Aid';
            return key.charAt(0).toUpperCase() + key.slice(1);
        };

        // Build ratings HTML
        const ratingsHtml = Object.entries(this.#ratings)
            .filter(([_, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `<span class="rating-badge">${niceLabel(k)} <span class="rating-value">${v}/10</span></span>`)
            .join('');

        // Build comment preview (first 200 chars)
        const commentText = this.#message || '';
        const preview = commentText.slice(0, 200);

        return `<div class="feedback-row"><div class="feedback-meta"><time class="feedback-time">${this.#dateSubmitted.toLocaleString()}</time><div class="feedback-ratings">${ratingsHtml}</div></div><div class="feedback-comment">${preview}</div></div>`;
    }

    async submit() {
        const validation = this.validateInput();
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }
        await saveFeedback(this.toJSON());
        return { success: true, message: 'Feedback saved.' };
    }

    // Static factory to build from plain object
    static fromJSON(obj = {}) {
        if (!obj) return null;
        return new Feedback(obj.subject || '', obj.message || '', obj.ratings || {}, obj.submitted_at || new Date(), obj.id || obj.id);
    }
}

// Expose globally for legacy scripts
window.Feedback = Feedback;
