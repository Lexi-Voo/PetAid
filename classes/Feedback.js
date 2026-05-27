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

    getId() { return this.#id; }
    getSubject() { return this.#subject; }
    getMessage() { return this.#message; }
    getRatings() { return Object.assign({}, this.#ratings); }
    getDateSubmitted() { return this.#dateSubmitted; }

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

    // Return plain object view
    view() {
        return {
            id: this.getId(),
            subject: this.getSubject(),
            message: this.getMessage(),
            ratings: this.getRatings(),
            submitted_at: this.getDateSubmitted().toISOString()
        };
    }

    toJSON() { return this.view(); }

    // Submit: save to localStorage array 'petaid_feedback' (client-only)
    async submit() {
        const validation = this.validateInput();
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }
        const payload = this.toJSON();
        const key = 'petaid_feedback';
        let localSaved = false;

        // Persist locally first (offline-first)
        try {
            const raw = localStorage.getItem(key) || '[]';
            const arr = JSON.parse(raw);
            arr.push(payload);
            localStorage.setItem(key, JSON.stringify(arr));
            localSaved = true;
        } catch (err) {
            console.error('Feedback.submit localStorage save failed:', err);
        }

        // Attempt to persist on server if available
        let serverSaved = false;
        try {
            const res = await fetch('/api/save-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                serverSaved = true;
            } else {
                console.warn('Server save-feedback responded with status', res.status);
            }
        } catch (err) {
            console.warn('Feedback.submit server POST failed:', err);
        }

        if (serverSaved && localSaved) {
            return { success: true, message: 'Saved to localStorage and server' };
        } else if (serverSaved) {
            return { success: true, message: 'Saved to server (localStorage failed)' };
        } else if (localSaved) {
            return { success: true, message: 'Saved to localStorage (server unavailable)' };
        } else {
            return { success: false, errors: ['Failed to persist feedback locally and to server'] };
        }
    }

    // Static factory to build from plain object
    static fromJSON(obj = {}) {
        if (!obj) return null;
        return new Feedback(obj.subject || '', obj.message || '', obj.ratings || {}, obj.submitted_at || new Date(), obj.id || obj.id);
    }
}

// Expose globally for legacy scripts
window.Feedback = Feedback;
