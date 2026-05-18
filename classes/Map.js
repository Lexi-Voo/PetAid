import { ClinicDetails } from 'ClinicDetails.js';

// Shared presets JSON (served from /data/presets.json). We attempt to
// load it once into PRESET_CACHE so GetPresetLocations can return it
// synchronously if already available, otherwise fall back to defaults.
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
    }
    /**
     * Return a list of preset locations suitable for a dropdown.
     * If `selection` is omitted, this returns the presets array.
     * If `selection` matches a preset id or name, returns that preset and nearby clinics.
     * Otherwise falls back to a clinic name/address search.
     * @param {string} [selection]
     * @returns {Array|Object} presets array or search result object
     */
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

    /**
     * Reload presets from `/data/presets.json` and update cache.
     * Returns a promise resolving to the presets array (or fallback on error).
     */
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

        // Ties into your offline Leaflet setup from the previous question!
        // It moves the map view to this object's Latitude and Longitude
        leafletMapInstance.setView([this.Latitude, this.Longitude], 15);
        console.log(`Map centered on: ${this.Latitude}, ${this.Longitude}`);
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
}