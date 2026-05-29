import { ClinicDetails } from '../classes/ClinicDetails.js';

async function loadClinics() {
    try {
        const res = await fetch('data/clinics.json?t=' + Date.now());
        const arr = await res.json();
        if (!Array.isArray(arr)) return [];
        return arr.map(obj => ClinicDetails.fromJSON(obj)).filter(Boolean);
    } catch (e) {
        console.error('Failed to load clinics:', e);
        return [];
    }
}

async function saveClinics(clinics) {
    const arr = clinics.map(c => (c.toJSON ? c.toJSON() : c));
    try {
        const res = await fetch('/api/save-clinics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(arr)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.error("Could not sync clinics.json:", err);
    }
}

async function addClinic(clinic) {
    const clinics = await loadClinics();
    clinics.push(clinic);
    await saveClinics(clinics);
    return clinics;
}

function clearClinics() {
    // No-op since we no longer use localStorage for clinics
}
