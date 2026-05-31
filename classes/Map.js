import { ClinicDetails } from './ClinicDetails.js';

const PRESET_URL = 'data/presets.json';
let PRESET_CACHE = null;

if (typeof fetch === 'function') {
    fetch(PRESET_URL).then(r => r.ok ? r.json() : null).then(json => {
        if (Array.isArray(json)) PRESET_CACHE = json;
    }).catch(() => {/* ignore */});
}

export class Map {
    /**
     * @param {number} latitude
     * @param {number} longitude 
     * @param {Array<ClinicDetails>} clinics
     */
    constructor(latitude, longitude, clinics = []) {
        this.Latitude = latitude;
        this.Longitude = longitude;
        this.Clinics = clinics;
        this.leafletMap = null;
        this.tileLayer = null;
        this.markers = [];
        this.refLocation = null;
        this.explicitRef = false;
        this.awaitingRefClick = false;
        this.isInitialized = false;
        this.loadClinicsFn = null;
        // Editing and picking state
        this.isEditing = false;
        this.editingIndex = null;
        this.isPicking = false;
        // Storage functions (to be set by page)
        this.storageFunctions = { load: null, save: null, add: null };
    }

    /**
     * Set storage functions (loadClinics, saveClinics, addClinic)
     */
    setStorageFunctions(load, save, add) {
        this.storageFunctions = { load, save, add };
    }
    GetPresetLocations() {
        if (PRESET_CACHE && PRESET_CACHE.length) return PRESET_CACHE;

        // Fallback hard-coded presets (used if JSON couldn't be loaded yet)
        return [
            { id: 'center', name: 'Map Center', latitude: 1.5575585937055665, longitude: 110.3425426087814 },
            { id: 'nw', name: 'Northwest Corner', latitude: 1.6423989330919126, longitude: 110.12498090143737 },
            { id: 'ne', name: 'Northeast Corner', latitude: 1.6423989330919126, longitude: 110.56010431612543 },
            { id: 'sw', name: 'Southwest Corner', latitude: 1.4727182543192203, longitude: 110.12498090143737 },
            { id: 'se', name: 'Southeast Corner', latitude: 1.4727182543192203, longitude: 110.56010431612543 }
        ];
    }

    static async ReloadPresets() {
        if (typeof fetch !== 'function') return null;
        try {
            const res = await fetch(PRESET_URL);
            if (!res.ok) return PRESET_CACHE;
            const json = await res.json();
            if (Array.isArray(json)) PRESET_CACHE = json;
            return PRESET_CACHE;
        } catch (e) {
            return PRESET_CACHE;
        }
    }

    SearchLocation(selection) {
        // No selection -> return presets for building a dropdown
        if (!selection) {
            const presets = this.GetPresetLocations();
            console.log(`Returning ${presets.length} preset locations.`);
            return presets;
        }

        // Try to match a preset by id or name (case-insensitive)
        const presets = this.GetPresetLocations();
        const lower = String(selection).toLowerCase();
        const preset = presets.find(p => p.id.toLowerCase() === lower || p.name.toLowerCase() === lower);

        if (preset) {
            // Return the preset and any nearby clinics (if clinic objects implement GetDistance)
            const clinicsNearby = this.Clinics.filter(clinic => {
                if (typeof clinic.GetDistance === 'function') {
                    const distance = clinic.GetDistance(preset.latitude, preset.longitude);
                    return distance == null || distance <= 5; // within 5km as a sensible default
                }
                return true;
            });

            console.log(`Preset "${preset.name}" selected. Found ${clinicsNearby.length} nearby clinics.`);
            return { type: 'preset', preset, clinics: clinicsNearby };
        }

        // Fallback: treat selection as a free-text clinic search
        console.log(`Searching for clinics matching: "${selection}"...`);
        const results = this.Clinics.filter(clinic => {
            const name = clinic.ClinicName || '';
            const addr = clinic.Address || '';
            return name.toLowerCase().includes(lower) || addr.toLowerCase().includes(lower);
        });

        console.log(`Found ${results.length} local matching clinics.`);
        return { type: 'clinics', results };
    }

    DisplayMap(leafletMapInstance) {
        if (!leafletMapInstance) {
            console.error("Leaflet map instance is required to display the map.");
            return;
        }
        leafletMapInstance.setView([this.Latitude, this.Longitude], 15);
        console.log(`Map centered on: ${this.Latitude}, ${this.Longitude}`);
    }

    /**
     * Create and initialize a Leaflet map inside the given container.
     * Attaches a tile layer and basic events useful to the app.
     * @param {string} containerId
     * @param {{latitude:number,longitude:number}} [start]
     * @param {object} [options]
     */
    async CreateLeafletMap(containerId, start = null, options = {}) {
        if (typeof L === 'undefined') {
            console.error('Leaflet (L) is not available in this environment.');
            return null;
        }
        const s = start || { latitude: this.Latitude, longitude: this.Longitude };
        const zoom = options.zoom ?? 15;
        const tileUrl = options.tileUrl ?? 'Tile/{z}/{x}/{y}.png';
        const tileOptions = Object.assign({ minZoom: 14, maxZoom: 16, noWrap: true, attribution: 'Local tiles' }, options.tileOptions || {});

        this.leafletMap = L.map(containerId).setView([s.latitude, s.longitude], zoom);
        this.tileLayer = L.tileLayer(tileUrl, tileOptions).addTo(this.leafletMap);
        try {
            this.tileLayer.on('tileerror', (err) => console.warn('tile error', err));
            this.tileLayer.on('tileload', (e) => {/* optional */});
        } catch (e) { console.warn('tileLayer event attach failed', e); }

        this.refLocation = this.leafletMap.getCenter();
        this.leafletMap.on('moveend', () => { if (!this.explicitRef) { this.refLocation = this.leafletMap.getCenter(); } });

        window.__petaid_map = this.leafletMap;
        this.isInitialized = true;
        return this.leafletMap;
    }

    /**
     * Provide a function used to load clinics when rendering markers.
     * @param {Function} fn async function returning an array of clinics
     */
    setLoadClinicsFn(fn) {
        this.loadClinicsFn = fn;
    }

    addMarkerForClinic(clinic, idx) {
        if (!this.leafletMap) return null;
        const lat = clinic._latitude ?? clinic.latitude ?? 0;
        const lng = clinic._longitude ?? clinic.longitude ?? 0;
        const marker = L.marker([lat, lng]).addTo(this.leafletMap);

        // Build popup: clinic details plus distance (if available)
        let popupHtml = (typeof clinic.ViewDetails === 'function') ? clinic.ViewDetails() : '';
        try {
            const ref = this.refLocation ?? this.leafletMap.getCenter();
            const refLat = ref.lat ?? ref.latitude;
            const refLng = ref.lng ?? ref.longitude;
            if (typeof clinic.GetDistance === 'function') {
                const dist = clinic.GetDistance(refLat, refLng);
                if (dist != null && !Number.isNaN(dist)) popupHtml += `<p><strong>Distance:</strong> ${dist} km</p>`;
            }
        } catch (e) {
            console.warn('Distance computation failed', e);
        }

        popupHtml += `<div style="margin-top:8px"><button class="set-ref-click btn btn-outline btn-sm">Set reference by clicking map</button>`;

        try {
            const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
            const role = user && typeof user.getRole === 'function' ? user.getRole() : '';
            if (role === 'admin') {
                popupHtml += ` <button class="edit-clinic btn btn-primary btn-sm" data-idx="${typeof idx !== 'undefined' ? idx : ''}">Edit</button>`;
            }
        } catch (e) { /* ignore user check errors */ }

        popupHtml += `</div>`;

        marker.bindPopup(popupHtml);
        this.markers.push(marker);
        return marker;
    }

    clearMarkers() { if (!this.leafletMap) return; this.markers.forEach(m => this.leafletMap.removeLayer(m)); this.markers.length = 0; }

    async renderClinics() {
        console.log('renderClinics: start');
        if (!this.isInitialized) return;
        this.clearMarkers();
        let clinics = [];
        try {
            if (typeof this.loadClinicsFn === 'function') clinics = await this.loadClinicsFn();
            else clinics = this.Clinics || [];
        } catch (e) {
            console.warn('renderClinics: failed to load clinics', e);
            clinics = this.Clinics || [];
        }
        console.log('renderClinics: clinics loaded', Array.isArray(clinics) ? clinics.length : clinics);
        clinics.forEach((c, i) => this.addMarkerForClinic(c, i));
        window.__petaid_markers = this.markers;
    }

    setReference(latlng) {
        if (!latlng) return;
        this.refLocation = latlng;
        this.explicitRef = true;
        this.awaitingRefClick = false;
        this.renderClinics();
    }

    /**
     * Start editing a clinic by index. Load from storage and return clinic data.
     * @param {number} index
     * @returns {Promise<ClinicDetails|null>}
     */
    async startEditingClinic(index) {
        if (typeof this.storageFunctions.load !== 'function') {
            console.error('Load function not set');
            return null;
        }
        try {
            const clinics = await this.storageFunctions.load();
            if (Array.isArray(clinics) && clinics[index]) {
                this.isEditing = true;
                this.editingIndex = index;
                return clinics[index];
            }
        } catch (e) {
            console.error('Failed to load clinics for editing', e);
        }
        return null;
    }

    /**
     * Cancel editing and reset state.
     */
    cancelEditing() {
        this.isEditing = false;
        this.editingIndex = null;
    }

    /**
     * Toggle picking mode (for selecting clinic coordinates on map).
     * @returns {boolean} new picking state
     */
    togglePickingMode() {
        this.isPicking = !this.isPicking;
        return this.isPicking;
    }

    /**
     * Save a new or existing clinic with provided form data.
     * @param {object} formData { name, address, phone, hours, lat, lng }
     * @returns {Promise<boolean>} success flag
     */
    async saveClinic(formData) {
        const { name, address, phone, hours, lat, lng } = formData;
        if (!name || Number.isNaN(lat) || Number.isNaN(lng)) {
            console.error('Invalid clinic data: missing name or coordinates');
            return false;
        }

        if (typeof this.storageFunctions.load !== 'function' || typeof this.storageFunctions.save !== 'function' || typeof this.storageFunctions.add !== 'function') {
            console.error('Storage functions not fully set');
            return false;
        }

        try {
            if (this.isEditing && typeof this.editingIndex === 'number' && !Number.isNaN(this.editingIndex)) {
                // Update existing clinic
                const clinics = await this.storageFunctions.load();
                const existing = clinics[this.editingIndex];
                if (existing) {
                    if (typeof existing.UpdateDetails === 'function') {
                        existing.UpdateDetails({
                            ClinicName: name,
                            Address: address,
                            PhoneNumber: phone,
                            OpeningHours: hours,
                            latitude: lat,
                            longitude: lng
                        });
                    } else {
                        // Fallback: replace object
                        const clinic = new ClinicDetails(name, address, phone, hours, lat, lng);
                        clinics[this.editingIndex] = clinic;
                    }
                    await this.storageFunctions.save(clinics);
                } else {
                    console.warn('Save: target clinic index not found');
                    return false;
                }
            } else {
                // Add new clinic
                const clinic = new ClinicDetails(name, address, phone, hours, lat, lng);
                await this.storageFunctions.add(clinic);
            }
            return true;
        } catch (e) {
            console.error('Error saving clinic:', e);
            return false;
        }
    }

    /**
     * Apply a preset selection to this Map instance (update internal lat/lng).
     * @param {string} presetIdOrName
     * @returns {Object|null} selected preset or null
     */
    SelectPreset(presetIdOrName) {
        if (!presetIdOrName) return null;
        const presets = this.GetPresetLocations();
        const lower = String(presetIdOrName).toLowerCase();
        const preset = presets.find(p => p.id.toLowerCase() === lower || p.name.toLowerCase() === lower);
        if (!preset) return null;
        this.Latitude = preset.latitude;
        this.Longitude = preset.longitude;
        return preset;
    }

    /**
     * Find the preset and center a given Leaflet map on it.
     * @param {Object} leafletMapInstance - Leaflet map instance
     * @param {string} presetIdOrName - preset id or name
     * @param {number} zoom - optional zoom level
     * @returns {Object|null} preset or null
     */
    ApplyPresetToLeaflet(leafletMapInstance, presetIdOrName, zoom = 15) {
        const preset = this.SelectPreset(presetIdOrName);
        if (!preset) return null;
        if (leafletMapInstance && typeof leafletMapInstance.setView === 'function') {
            leafletMapInstance.setView([preset.latitude, preset.longitude], zoom);
        }
        console.log(`Applied preset "${preset.name}" to map.`);
        return preset;
    }

    GetNearbyVets(radiusKm = 5) {
        console.log(`Finding vets within ${radiusKm}km of ${this.Latitude}, ${this.Longitude}...`);

        const nearbyVets = this.Clinics.filter(clinic => {
            const distance = clinic.GetDistance(this.Latitude, this.Longitude);
            return distance <= radiusKm;
        });

        console.log(`Found ${nearbyVets.length} nearby vets.`);
        return nearbyVets;
    }

    /**
     * Get the current editing index (for UI to prefill form with old values).
     */
    getEditingIndex() {
        return this.isEditing ? this.editingIndex : null;
    }
}