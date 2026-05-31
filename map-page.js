import { loadClinics, saveClinics, addClinic as storageAddClinic } from './utils/ClinicStorage.js';
import { Map as PetMap } from './classes/Map.js';

console.log('map-page: module loaded');

(async function(){
    console.log('map-page: IIFE start');
    try {
    // Default start location for map center
    const defaultCenter = { latitude: 1.5575585937055665, longitude: 110.3425426087814 };

    let clinics = [];
    try {
        clinics = await loadClinics();
        console.log('map-page: clinics loaded, count =', Array.isArray(clinics) ? clinics.length : 0);
    } catch (e) {
        console.warn('Failed to load clinics', e);
    }

    const mapObj = new PetMap(defaultCenter.latitude, defaultCenter.longitude, clinics);
    await mapObj.CreateLeafletMap('map', { tileUrl: 'Tile/{z}/{x}/{y}.png', tileOptions: { minZoom: 14, maxZoom: 16, noWrap: true, attribution: 'Local tiles' } });
    mapObj.DisplayMap(mapObj.leafletMap);
    const map = mapObj.leafletMap;
    console.log('map-page: map created');
    window.__petaid_map = map;

    const select = document.getElementById('presetSelect');
    if (select) {
        const allOptions = mapObj.SearchLocation();
        console.log('map-page: dropdown options count =', allOptions.length);
        allOptions.forEach(opt => { 
            const option = document.createElement('option'); 
            option.value = opt.id; 
            option.textContent = `${opt.name}`;
            select.appendChild(option); 
        });
    }

    if (select) {
        select.addEventListener('change', () => {
            if (!select.value) return;
            // Navigate to selected clinic location
            const allOptions = mapObj.SearchLocation();
            const clinicOption = allOptions.find(o => o.id === select.value);
            if (clinicOption) {
                map.setView([clinicOption.latitude, clinicOption.longitude], 15);
                console.log(`Navigated to clinic: ${clinicOption.name}`);
            }
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

            if (evt.target.closest && evt.target.closest('.leaflet-popup-content')) {
                return;
            }
        });
    } catch (err) {
        console.error('Error setting up map click handlers:', err);
    }

    const modalOverlay = document.getElementById('clinicModalOverlay');
    const pickLocationBtn = document.getElementById('pickLocationBtn');
    const saveClinicBtn = document.getElementById('saveClinicBtn');
    const cancelClinicBtn = document.getElementById('cancelClinicBtn');
    const showAddBtn = document.getElementById('showAddForm');
    const yourLocationBtn = document.getElementById('yourLocationBtn');
    const showNearbyVetsBtn = document.getElementById('showNearbyVetsBtn');

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
    if (yourLocationBtn) {
        yourLocationBtn.addEventListener('click', () => {
            const isPickingLocation = !mapObj.awaitingRefClick;
            mapObj.awaitingRefClick = isPickingLocation;
            yourLocationBtn.textContent = isPickingLocation ? 'Click map to set your location...' : 'Your Location';
            console.log('map-page: location picking mode', isPickingLocation ? 'enabled' : 'disabled');
        });
    }
    if (showNearbyVetsBtn) {
        showNearbyVetsBtn.addEventListener('click', () => {
            if (!mapObj.explicitRef) {
                const mapCenter = map.getCenter();
                mapObj.refLocation = mapCenter;
                console.log('map-page: using map center as reference for nearby vets');
            }
            const nearby = mapObj.GetNearbyVets(2);
            if (nearby.length > 0) {
                alert(`Found ${nearby.length} nearby vets within 2km.`);
            } else {
                alert('No nearby vets found within 2km.');
            }
        });
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

        if (mapObj.awaitingRefClick) {
            mapObj.setReference(e.latlng);
            mapObj.awaitingRefClick = false;
            
            if (yourLocationBtn) {
                yourLocationBtn.textContent = '✓ Location set!';
                setTimeout(() => { yourLocationBtn.textContent = 'Your Location'; }, 2000);
            }
        }
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
