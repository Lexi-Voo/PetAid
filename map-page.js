import { loadClinics, saveClinics, addClinic as storageAddClinic } from './utils/ClinicStorage.js';
import { ClinicDetails } from './classes/ClinicDetails.js';

console.log('map-page: module loaded');

// run map logic in an async IIFE and surface any errors
(async function(){
    console.log('map-page: IIFE start');
    try {
    const fallback = [
        { id: 'center', name: 'Map Center', latitude: 1.5575585937055665, longitude: 110.3425426087814 },
        { id: 'nw', name: 'Northwest Corner', latitude: 1.6423989330919126, longitude: 110.12498090143737 },
        { id: 'ne', name: 'Northeast Corner', latitude: 1.6423989330919126, longitude: 110.56010431612543 },
        { id: 'sw', name: 'Southwest Corner', latitude: 1.4727182543192203, longitude: 110.12498090143737 },
        { id: 'se', name: 'Southeast Corner', latitude: 1.4727182543192203, longitude: 110.56010431612543 }
    ];

    let presets = fallback;
    try {
        const res = await fetch('data/presets.json');
        if (res.ok) presets = await res.json();
    } catch (e) {
        console.warn('Could not load data/presets.json — using fallback presets', e);
    }
    console.log('map-page: presets ready, count =', Array.isArray(presets) ? presets.length : typeof presets);

    const select = document.getElementById('presetSelect');
    if (select) {
        presets.forEach(p => { const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; select.appendChild(opt); });
    }

    const start = presets[0] || fallback[0];
    console.log('map-page: selected start', start && start.latitude && start.longitude ? `${start.latitude},${start.longitude}` : start);
    const map = L.map('map').setView([start.latitude, start.longitude], 15);
    console.log('map-page: creating tile layer with URL Tile/{z}/{x}/{y}.png');
    const tileLayer = L.tileLayer('Tile/{z}/{x}/{y}.png', {
        minZoom: 14,
        maxZoom: 16,
        noWrap: true,
        attribution: 'Local tiles'
    }).addTo(map);

    // attach tile events for debugging
    try {
        tileLayer.on('tileerror', (err) => console.warn('tile error', err));
        tileLayer.on('tileload', (e) => {/* optional: console.log('tile loaded', e.tile && e.tile.src) */});
    } catch (e) { console.warn('tileLayer event attach failed', e); }

    console.log('map-page: map created');
    // expose for debugging
    window.__petaid_map = map;

    if (select) {
        select.addEventListener('change', () => {
            const preset = presets.find(p => p.id === select.value);
            if (preset) map.setView([preset.latitude, preset.longitude], 15);
        });
    }

    // Reference location used to compute distances.
    // Default: map center. If the user clicks anywhere on the map (outside pick-mode),
    // the clicked point becomes the explicit reference and distances are recomputed.
    let refLocation = map.getCenter();
    let explicitRef = false; // becomes true after the user clicks the map to set reference
    let awaitingRefClick = false; // true when user clicked the popup button and is expected to click map
        
    // marker list for clearing when re-rendering
    const markers = [];
    // Editing state
    let isEditing = false;
    let editingIndex = null;

    function addMarkerForClinic(clinic, idx) {
        const lat = clinic._latitude ?? clinic.latitude ?? 0;
        const lng = clinic._longitude ?? clinic.longitude ?? 0;
        const marker = L.marker([lat, lng]).addTo(map);

        // Build popup: clinic details plus distance (if available)
        let popupHtml = clinic.ViewDetails();
        try {
            const ref = refLocation ?? map.getCenter();
            const refLat = ref.lat ?? ref.latitude;
            const refLng = ref.lng ?? ref.longitude;
            if (typeof clinic.GetDistance === 'function') {
                const dist = clinic.GetDistance(refLat, refLng);
                if (dist != null && !Number.isNaN(dist)) popupHtml += `<p><strong>Distance:</strong> ${dist} km</p>`;
            }
        } catch (e) {
            console.warn('Distance computation failed', e);
        }

        // add popup button to allow setting the reference by clicking the map
        popupHtml += `<div style="margin-top:8px"><button class="set-ref-click btn btn-outline btn-sm">Set reference by clicking map</button>`;

        // show Edit button for admin users
        try {
            const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
            const role = user && typeof user.getRole === 'function' ? user.getRole() : '';
            if (role === 'admin') {
                popupHtml += ` <button class="edit-clinic btn btn-primary btn-sm" data-idx="${typeof idx !== 'undefined' ? idx : ''}">Edit</button>`;
            }
        } catch (e) { /* ignore user check errors */ }

        popupHtml += `</div>`;

        marker.bindPopup(popupHtml);
        markers.push(marker);
        return marker;
    }
    function clearMarkers() { markers.forEach(m => map.removeLayer(m)); markers.length = 0; }
    async function renderClinics() {
        console.log('renderClinics: start');
        clearMarkers();
        const clinics = await loadClinics();
        console.log('renderClinics: clinics loaded', Array.isArray(clinics) ? clinics.length : clinics);
        clinics.forEach((c, i) => addMarkerForClinic(c, i));
        window.__petaid_markers = markers;
    }

    // Initial render using map center
    await renderClinics();
    console.log('map-page: initial render complete');
    window.__petaid_renderClinics = renderClinics;

    // While no explicit reference has been set by the user, update distances when the map is moved
    map.on('moveend', () => { if (!explicitRef) { refLocation = map.getCenter(); renderClinics(); } });

    // Delegate clicks on the popup "Set reference" button. When clicked, the user should click
    // the map to choose the reference location; we change the button text while awaiting the click.
    try {
        const mapContainer = map.getContainer();
        mapContainer.addEventListener('click', async (evt) => {
            // Set reference button
            const setBtn = evt.target.closest && evt.target.closest('.set-ref-click');
            if (setBtn) {
                evt.stopPropagation();
                awaitingRefClick = true;
                setBtn.textContent = 'Click on map to set reference...';
                return;
            }

            // Edit clinic button (admin only)
            const editBtn = evt.target.closest && evt.target.closest('.edit-clinic');
            if (editBtn) {
                evt.stopPropagation();
                const idxAttr = editBtn.getAttribute('data-idx');
                const idx = (typeof idxAttr !== 'undefined' && idxAttr !== null && idxAttr !== '') ? Number(idxAttr) : NaN;
                try {
                    const clinics = await loadClinics();
                    if (!Number.isNaN(idx) && clinics[idx]) {
                        const clinic = clinics[idx];
                        // Prefill modal fields with clinic data
                        const nameEl = document.getElementById('c_name');
                        const addrEl = document.getElementById('c_address');
                        const phoneEl = document.getElementById('c_phone');
                        const hoursEl = document.getElementById('c_hours');
                        const latEl = document.getElementById('c_lat');
                        const lngEl = document.getElementById('c_lng');
                        if (nameEl) nameEl.value = clinic.ClinicName || clinic.name || '';
                        if (addrEl) addrEl.value = clinic.Address || clinic.address || '';
                        if (phoneEl) phoneEl.value = clinic.PhoneNumber || clinic.phone || clinic.phoneNumber || '';
                        if (hoursEl) hoursEl.value = clinic.OpeningHours || clinic.openingHours || '';
                        if (latEl) latEl.value = clinic._latitude ?? clinic.latitude ?? '';
                        if (lngEl) lngEl.value = clinic._longitude ?? clinic.longitude ?? '';

                        if (modalOverlay) { modalOverlay.classList.add('active'); modalOverlay.setAttribute('aria-hidden','false'); }
                        isEditing = true;
                        editingIndex = idx;
                        const modalTitle = document.getElementById('clinicModalTitle');
                        if (modalTitle) modalTitle.textContent = 'Edit Clinic';
                    } else {
                        console.warn('Edit target not found for idx', idx);
                    }
                } catch (e) {
                    console.error('Failed to load clinics for edit', e);
                }
                return;
            }
        });
    } catch (err) { /* ignore if container not available */ }

    const modalOverlay = document.getElementById('clinicModalOverlay');
    const pickLocationBtn = document.getElementById('pickLocationBtn');
    const saveClinicBtn = document.getElementById('saveClinicBtn');
    const cancelClinicBtn = document.getElementById('cancelClinicBtn');
    const showAddBtn = document.getElementById('showAddForm');

    try {
        const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
        const role = user && typeof user.getRole === 'function' ? user.getRole() : '';
        if (!user || role !== 'admin') {
            if (showAddBtn && typeof showAddBtn.remove === 'function') showAddBtn.remove();
            else if (showAddBtn) showAddBtn.style.display = 'none';
        }
    } catch (err) {
        console.warn('Role check failed, hiding Add Clinic by default', err);
        if (showAddBtn) showAddBtn.style.display = 'none';
    }

    let picking = false;
    if (showAddBtn) {
        showAddBtn.addEventListener('click', () => { modalOverlay.classList.add('active'); modalOverlay.setAttribute('aria-hidden','false'); });
    }
    if (cancelClinicBtn) cancelClinicBtn.addEventListener('click', () => { 
        modalOverlay.classList.remove('active'); 
        modalOverlay.setAttribute('aria-hidden','true'); 
        // reset editing state
        isEditing = false; editingIndex = null; 
        const modalTitle = document.getElementById('clinicModalTitle'); if (modalTitle) modalTitle.textContent = 'Add Clinic';
    });
    if (pickLocationBtn) pickLocationBtn.addEventListener('click', () => { picking = !picking; pickLocationBtn.textContent = picking ? 'Click map to pick' : 'Pick on map'; });
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { modalOverlay.classList.remove('active'); modalOverlay.setAttribute('aria-hidden','true'); isEditing = false; editingIndex = null; const modalTitle = document.getElementById('clinicModalTitle'); if (modalTitle) modalTitle.textContent = 'Add Clinic'; } });
    // Map click handling: used for clinic coordinate picking (when `picking`),
    // otherwise any map click sets the reference location and updates distances.
    map.on('click', function(e) {
        if (picking) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            const latEl = document.getElementById('c_lat');
            const lngEl = document.getElementById('c_lng');
            if (latEl) latEl.value = lat;
            if (lngEl) lngEl.value = lng;
            picking = false;
            if (pickLocationBtn) pickLocationBtn.textContent = 'Pick on map';
            return;
        }

        // Use this click as the explicit reference location
        refLocation = e.latlng;
        explicitRef = true;
        awaitingRefClick = false;

        // Reset any popup buttons text
        try {
            const container = map.getContainer();
            container.querySelectorAll('.set-ref-click').forEach(b => b.textContent = 'Set reference by clicking map');
        } catch (err) { /* ignore */ }

        renderClinics();
    });

    if (saveClinicBtn) saveClinicBtn.addEventListener('click', async () => {
        const name = (document.getElementById('c_name')?.value || '').trim();
        const address = (document.getElementById('c_address')?.value || '').trim();
        const phone = (document.getElementById('c_phone')?.value || '').trim();
        const hours = (document.getElementById('c_hours')?.value || '').trim();
        const lat = parseFloat(document.getElementById('c_lat')?.value);
        const lng = parseFloat(document.getElementById('c_lng')?.value);
        if (!name || Number.isNaN(lat) || Number.isNaN(lng)) { alert('Provide name and valid coordinates.'); return; }
        const clinic = new ClinicDetails(name, address, phone, hours, lat, lng);

        try {
            if (isEditing && typeof editingIndex === 'number' && !Number.isNaN(editingIndex)) {
                // Update existing clinic
                const clinics = await loadClinics();
                if (clinics[editingIndex]) {
                    clinics[editingIndex] = clinic;
                    await saveClinics(clinics);
                } else {
                    console.warn('Save: target clinic index not found, falling back to add');
                    await storageAddClinic(clinic);
                }
            } else {
                // Add new clinic
                await storageAddClinic(clinic);
            }
        } catch (e) {
            console.error('Error saving clinic:', e);
        }

        // Refresh markers and UI
        await renderClinics();
        if (modalOverlay) { modalOverlay.classList.remove('active'); modalOverlay.setAttribute('aria-hidden','true'); }
        ['c_name','c_address','c_phone','c_hours','c_lat','c_lng'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        // Reset editing state
        isEditing = false;
        editingIndex = null;
        const modalTitle = document.getElementById('clinicModalTitle');
        if (modalTitle) modalTitle.textContent = 'Add Clinic';
    });
    } catch (err) {
        console.error('map-page: uncaught error in IIFE', err);
    }
})();
