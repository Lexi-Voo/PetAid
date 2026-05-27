// feedback.js - page script for Feedback.html
document.addEventListener('DOMContentLoaded', () => {
    // populate radio bubbles for each field
    (function hydrateRadios(){
        const fields = ['forum','quiz','firstaid','login','map'];
        fields.forEach(field => {
            const container = document.querySelector(`.rating-bubbles[data-field="${field}"]`);
            if (!container) return;
            container.innerHTML = '';
            for (let n=1;n<=10;n++) {
                const input = document.createElement('input');
                input.type = 'radio'; input.name = field; input.id = `${field}_${n}`; input.value = String(n);
                const label = document.createElement('label'); label.htmlFor = input.id; label.textContent = String(n);
                container.appendChild(input); container.appendChild(label);
            }
        });
    })();

    const form = document.getElementById('feedbackForm');
    if (!form) return;

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        const getVal = (name) => {
            const v = document.querySelector(`input[name="${name}"]:checked`);
            return v ? Number(v.value) : null;
        };
        const ratings = {
            forum: getVal('forum'),
            quiz: getVal('quiz'),
            firstAid: getVal('firstaid'),
            login: getVal('login'),
            map: getVal('map')
        };

        const fb = new Feedback('Site feedback', document.getElementById('comments').value.trim(), ratings);
        const result = await fb.submit();
        const resEl = document.getElementById('feedbackResult');
        if (result && result.success) {
            if (resEl) resEl.textContent = 'Feedback submitted — thank you!';
            form.reset();
        } else {
            const msg = result && result.errors ? result.errors.join('; ') : 'Failed to submit feedback.';
            if (resEl) resEl.textContent = msg;
            console.error('Feedback submit result', result);
        }
    });
});
