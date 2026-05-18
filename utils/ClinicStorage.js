import { ClinicDetails } from '../classes/ClinicDetails.js';

const STORAGE_KEY = 'petaid_clinics';

export function loadClinics() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.map(obj => ClinicDetails.fromJSON(obj)).filter(Boolean);
    } catch (e) {
        console.error('Failed to parse clinics from storage', e);
        return [];
    }
}

export function saveClinics(clinics) {
    const arr = clinics.map(c => (c.toJSON ? c.toJSON() : c));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function addClinic(clinic) {
    const clinics = loadClinics();
    clinics.push(clinic);
    saveClinics(clinics);
    return clinics;
}

export function clearClinics() {
    localStorage.removeItem(STORAGE_KEY);
}

export function exportClinics() {
    const data = localStorage.getItem(STORAGE_KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinics.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export async function importClinicsFromFile(file, { merge = true } = {}) {
    if (!file) return [];
    const text = await file.text();
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new Error('Invalid JSON file');
    }
    if (!Array.isArray(parsed)) throw new Error('Expected an array of clinic objects');
    const newClinics = parsed.map(obj => ClinicDetails.fromJSON(obj)).filter(Boolean);
    if (merge) {
        const clinics = loadClinics();
        const merged = clinics.concat(newClinics);
        saveClinics(merged);
        return merged;
    } else {
        saveClinics(newClinics);
        return newClinics;
    }
}
