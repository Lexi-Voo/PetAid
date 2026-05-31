import { ClinicDetails } from './ClinicDetails.js';

export class Map {
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
        this.isEditing = false;
        this.editingIndex = null;
        this.isPicking = false;
        // Storage functions (to be set by page)
        this.storageFunctions = { load: null, save: null, add: null };
    }

    setStorageFunctions(load, save, add) {
        this.storageFunctions = { load, save, add };
    }

    SearchLocation(selection) {
        if (!selection) {
            const options = this.Clinics.map((c, idx) => ({ 
                id: `clinic_${idx}`, 
                name: c.ClinicName || 'Clinic', 
                type: 'clinic', 
                latitude: c._latitude, 
                longitude: c._longitude, 
                clinic: c, 
                index: idx 
            }));
            console.log(`Returning ${options.length} clinics for dropdown.`);
            return options;
        }

        console.log(`Searching for clinics matching: "${selection}"...`);
        const results = this.Clinics.filter(clinic => {
            const name = clinic.ClinicName || '';
            const addr = clinic.Address || '';
            return name.toLowerCase().includes(String(selection).toLowerCase()) || addr.toLowerCase().includes(String(selection).toLowerCase());
        });

        console.log(`Found ${results.length} local matching clinics.`);
        return { type: 'clinics', results };
    }

    DisplayMap(leafletMapInstance) {
        if (!leafletMapInstance) {
            console.error("Leaflet map instance is required to display the map.");
            return;
        }
        const zoom = 15;
        leafletMapInstance.setView([this.Latitude, this.Longitude], zoom);
        console.log(`Map displayed and centered on: ${this.Latitude}, ${this.Longitude}`);
    }

    async CreateLeafletMap(containerId, options = {}) {
        if (typeof L === 'undefined') {
            console.error('Leaflet (L) is not available in this environment.');
            return null;
        }
        const tileUrl = options.tileUrl ?? 'Tile/{z}/{x}/{y}.png';
        const tileOptions = Object.assign({ minZoom: 14, maxZoom: 16, noWrap: true, attribution: 'Local tiles' }, options.tileOptions || {});

        this.leafletMap = L.map(containerId);
        this.tileLayer = L.tileLayer(tileUrl, tileOptions).addTo(this.leafletMap);
        try {
            this.tileLayer.on('tileerror', (err) => console.warn('tile error', err));
            this.tileLayer.on('tileload', (e) => {/* optional */});
        } catch (e) { console.warn('tileLayer event attach failed', e); }

        this.leafletMap.on('moveend', () => { if (!this.explicitRef) { this.refLocation = this.leafletMap.getCenter(); } });

        window.__petaid_map = this.leafletMap;
        this.isInitialized = true;
        console.log('Map created in container, ready for display.');
        return this.leafletMap;
    }

    setLoadClinicsFn(fn) {
        this.loadClinicsFn = fn;
    }

    addMarkerForClinic(clinic, idx) {
        if (!this.leafletMap) return null;
        const lat = clinic._latitude ?? clinic.latitude ?? 0;
        const lng = clinic._longitude ?? clinic.longitude ?? 0;
        const marker = L.marker([lat, lng]).addTo(this.leafletMap);

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

        try {
            const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
            const role = user && typeof user.getRole === 'function' ? user.getRole() : '';
            if (role === 'admin') {
                popupHtml += `<div style="margin-top:8px"><button class="edit-clinic btn btn-primary btn-sm" data-idx="${typeof idx !== 'undefined' ? idx : ''}">Edit</button></div>`;
            }
        } catch (e) { /* ignore user check errors */ }

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

    cancelEditing() {
        this.isEditing = false;
        this.editingIndex = null;
    }

    togglePickingMode() {
        this.isPicking = !this.isPicking;
        return this.isPicking;
    }

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
                        const clinic = new ClinicDetails(name, address, phone, hours, lat, lng);
                        clinics[this.editingIndex] = clinic;
                    }
                    await this.storageFunctions.save(clinics);
                } else {
                    console.warn('Save: target clinic index not found');
                    return false;
                }
            } else {
                const clinic = new ClinicDetails(name, address, phone, hours, lat, lng);
                await this.storageFunctions.add(clinic);
            }
            return true;
        } catch (e) {
            console.error('Error saving clinic:', e);
            return false;
        }
    }

    GetNearbyVets(radiusKm = 3) {
        if (!this.refLocation) {
            console.warn('No reference location set. Use setReference() first.');
            return [];
        }

        const refLat = this.refLocation.lat ?? this.refLocation.latitude;
        const refLng = this.refLocation.lng ?? this.refLocation.longitude;
        
        console.log(`Finding vets within ${radiusKm}km of ${refLat}, ${refLng}...`);

        const nearbyVets = this.Clinics.filter(clinic => {
            if (typeof clinic.GetDistance === 'function') {
                const distance = clinic.GetDistance(refLat, refLng);
                return distance != null && distance <= radiusKm;
            }
            return false;
        });

        console.log(`Found ${nearbyVets.length} nearby vets.`);
        
        // Zoom out to show all nearby vets, makes it easier to see them
        if (this.leafletMap && typeof this.leafletMap.setZoom === 'function') {
            this.leafletMap.setZoom(14);
        }
        
        return nearbyVets;
    }
}