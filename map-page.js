import { loadClinics, saveClinics, addClinic as storageAddClinic } from './utils/ClinicStorage.js';
import { Map as PetMap } from './classes/Map.js';

console.log('map-page: module loaded');

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

    const mapObj = new PetMap(start.latitude, start.longitude, []);
    await mapObj.CreateLeafletMap('map', start, { zoom: 15, tileUrl: 'Tile/{z}/{x}/{y}.png', tileOptions: { minZoom: 14, maxZoom: 16, noWrap: true, attribution: 'Local tiles' } });
    const map = mapObj.leafletMap;
    console.log('map-page: map created');
    window.__petaid_map = map;

    if (select) {
        select.addEventListener('change', () => {
            const preset = presets.find(p => p.id === select.value);
            if (preset) mapObj.ApplyPresetToLeaflet(map, preset.id ?? preset.name, 15);
        });
    }

    mapObj.setLoadClinicsFn(loadClinics);
    mapObj.setStorageFunctions(loadClinics, saveClinics, storageAddClinic);

    async function renderClinics() { await mapObj.renderClinics(); }

    await renderClinics();
    console.log('map-page: initial render complete');
    window.__petaid_renderClinics = renderClinics;

    try {
        const mapContainer = map.getContainer();
        mapContainer.addEventListener('click', async (evt) => {
            // Set reference button (check BEFORE popup content guard)
            const setBtn = evt.target.closest && evt.target.closest('.set-ref-click');
            if (setBtn) {
                evt.stopPropagation();
                mapObj.awaitingRefClick = true;
                setBtn.textContent = 'Click on map to set reference...';
                return;
            }

            // Edit clinic button (admin only) (check BEFORE popup content guard)
            const editBtn = evt.target.closest && evt.target.closest('.edit-clinic');
            if (editBtn) {
                evt.stopPropagation();
                const idxAttr = editBtn.getAttribute('data-idx');
                const idx = (typeof idxAttr !== 'undefined' && idxAttr !== null && idxAttr !== '') ? Number(idxAttr) : NaN;
                try {
                    (async () => {
                        const clinic = await mapObj.startEditingClinic(idx);
                        if (clinic) {
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
                            const modalTitle = document.getElementById('clinicModalTitle');
                            if (modalTitle) modalTitle.textContent = 'Edit Clinic';
                        } else {
                            console.warn('Edit target not found for idx', idx);
                        }
                    })();
                } catch (e) {
                    console.error('Failed to load clinics for edit', e);
                }
                return;
            }

            // Ignore clicks inside Leaflet popups to avoid interfering with popup behavior
            if (evt.target.closest && evt.target.closest('.leaflet-popup-content')) {
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

    if (showAddBtn) {
        showAddBtn.addEventListener('click', () => { modalOverlay.classList.add('active'); modalOverlay.setAttribute('aria-hidden','false'); });
    }
    if (cancelClinicBtn) cancelClinicBtn.addEventListener('click', () => { 
        modalOverlay.classList.remove('active'); 
        modalOverlay.setAttribute('aria-hidden','true'); 
        // reset editing state via Map
        mapObj.cancelEditing();
        const modalTitle = document.getElementById('clinicModalTitle'); if (modalTitle) modalTitle.textContent = 'Add Clinic';
    });
    if (pickLocationBtn) pickLocationBtn.addEventListener('click', () => { 
        const isPicking = mapObj.togglePickingMode();
        pickLocationBtn.textContent = isPicking ? 'Click map to pick' : 'Pick on map';
    });
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { modalOverlay.classList.remove('active'); modalOverlay.setAttribute('aria-hidden','true'); mapObj.cancelEditing(); const modalTitle = document.getElementById('clinicModalTitle'); if (modalTitle) modalTitle.textContent = 'Add Clinic'; } });
    map.on('click', function(e) {
        if (mapObj.isPicking) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            const latEl = document.getElementById('c_lat');
            const lngEl = document.getElementById('c_lng');
            if (latEl) latEl.value = lat;
            if (lngEl) lngEl.value = lng;
            mapObj.isPicking = false;
            if (pickLocationBtn) pickLocationBtn.textContent = 'Pick on map';
            return;
        }

        // Set reference location (updates distance calculations)
        const wasAwaitingRef = mapObj.awaitingRefClick;
        mapObj.setReference(e.latlng);

        try {
            const container = map.getContainer();
            container.querySelectorAll('.set-ref-click').forEach(b => b.textContent = 'Set reference by clicking map');
        } catch (err) { /* ignore */ }
    });

    if (saveClinicBtn) saveClinicBtn.addEventListener('click', async () => {
        const name = (document.getElementById('c_name')?.value || '').trim();
        const address = (document.getElementById('c_address')?.value || '').trim();
        const phone = (document.getElementById('c_phone')?.value || '').trim();
        const hours = (document.getElementById('c_hours')?.value || '').trim();
        const lat = parseFloat(document.getElementById('c_lat')?.value);
        const lng = parseFloat(document.getElementById('c_lng')?.value);
        if (!name || Number.isNaN(lat) || Number.isNaN(lng)) { alert('Provide name and valid coordinates.'); return; }

        const success = await mapObj.saveClinic({ name, address, phone, hours, lat, lng });
        if (!success) return;

        await renderClinics();
        if (modalOverlay) { modalOverlay.classList.remove('active'); modalOverlay.setAttribute('aria-hidden','true'); }
        ['c_name','c_address','c_phone','c_hours','c_lat','c_lng'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const modalTitle = document.getElementById('clinicModalTitle');
        if (modalTitle) modalTitle.textContent = 'Add Clinic';
    });
    } catch (err) {
        console.error('map-page: uncaught error in IIFE', err);
    }
})();
