async function loadFeedbackRecords() {
    try {
        const arr = await loadFeedback();
        if (arr.length > 0) return arr;
    } catch (e) { console.warn('Feedback load failed', e); }
    return [];
}

function computeMetrics(records) {
    const sections = ['forum','quiz','firstAid','login','map'];
    const counts = {};
    const sums = {};
    sections.forEach(s => { counts[s]=0; sums[s]=0; });

    records.forEach(r => {
        sections.forEach(s => {
            const key = s === 'firstAid' ? 'firstAid' : s;
            const val = r.ratings ? r.ratings[s] : (r[s] ?? null);
            const num = val === null || val === undefined ? null : Number(val);
            if (!Number.isNaN(num) && num !== null) {
                counts[s]++;
                sums[s] += num;
            }
        });
    });

    const averages = {};
    sections.forEach(s => { averages[s] = counts[s] > 0 ? +(sums[s]/counts[s]).toFixed(2) : 0; });
    return { sections, counts, averages };
}

function niceLabel(key) {
    if (key === 'firstAid') return 'First Aid';
    return key.charAt(0).toUpperCase() + key.slice(1);
}

(async function renderAnalytics(){
    const records = (await loadFeedbackRecords()) || [];
    const { sections, counts, averages } = computeMetrics(records);

    const ratingLabels = Array.from({length:10},(_,i)=>(i+1).toString());
    const ratingColors = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe'];

    const legendContainer = document.getElementById('rating-colors-legend');
    if (legendContainer) {
        legendContainer.innerHTML = ratingLabels.map((lab,i)=>{
            return `<div class="rating-legend-item"><span class="rating-swatch" style="background:${ratingColors[i]}"></span><strong class="rating-label">${lab}</strong></div>`;
        }).join('');
    }

    function renderPieFallback(canvasEl, dist, colors) {
        if (!canvasEl || !canvasEl.parentNode) return;
        const total = dist.reduce((a,b)=>a+b,0);
        const container = document.createElement('div');
        container.className = 'pie-fallback';
        if (total === 0) {
            container.style.background = 'var(--bg-light)';
        } else {
            let acc = 0;
            const stops = [];
            dist.forEach((count, i) => {
                if (count <= 0) return;
                const pct = (count/total)*100;
                stops.push(`${colors[i]} ${acc}% ${acc + pct}%`);
                acc += pct;
            });
            container.style.background = `conic-gradient(${stops.join(',')})`;
        }
        const center = document.createElement('div');
        center.className = 'pie-center';
        center.textContent = total ? `${total}` : '—';
        container.appendChild(center);
        canvasEl.parentNode.replaceChild(container, canvasEl);
    }

    function renderBarFallback(canvasEl, avg) {
        if (!canvasEl || !canvasEl.parentNode) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-fallback';
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        const percent = Math.max(0, Math.min(100, (avg/10)*100 || 0));
        fill.style.width = percent + '%';
        track.appendChild(fill);
        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = (typeof avg === 'number') ? avg.toFixed(2) : avg;
        wrapper.appendChild(track);
        wrapper.appendChild(value);
        canvasEl.parentNode.replaceChild(wrapper, canvasEl);
    }

    function getDistribution(records, section) {
        const out = Array.from({length:10}, ()=>0);
        records.forEach(r => {
            const val = r.ratings ? r.ratings[section] : (r[section] ?? null);
            const num = val === null || val === undefined ? null : Number(val);
            if (!Number.isNaN(num) && num !== null && num >= 1 && num <= 10) {
                out[num-1]++;
            }
        });
        return out;
    }

    const barColor = '#2b8cc4';
    sections.forEach((section, idx) => {
        const dist = getDistribution(records, section);
        const pieCanvas = document.getElementById('pie_' + section);
        const barCanvas = document.getElementById('bar_' + section);

        if (pieCanvas) renderPieFallback(pieCanvas, dist, ratingColors);
        const avg = averages[section] || 0;
        if (barCanvas) renderBarFallback(barCanvas, avg);
    });
    
    const listEl = document.getElementById('feedbackList');
    if (records.length === 0) {
        listEl.textContent = 'No feedback records found.';
    } else {
        listEl.innerHTML = records.map(r => {
            // Convert plain object to Feedback instance and use View() method
            const feedbackObj = Feedback.fromJSON(r);
            return feedbackObj ? feedbackObj.View() : '<p>Invalid feedback record</p>';
        }).join('');
    }
})();
