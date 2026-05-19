export class ClinicDetails {
    /**
     * @param {string} clinicName 
     * @param {string} address 
     * @param {string} phoneNumber 
     * @param {string} openingHours 
     * @param {number} latitude  - Added to allow distance calculation
     * @param {number} longitude - Added to allow distance calculation
     */
    constructor(clinicName, address, phoneNumber, openingHours, latitude = 0, longitude = 0) {
        this.ClinicName = clinicName;
        this.Address = address;
        this.PhoneNumber = phoneNumber;
        this.OpeningHours = openingHours;
        this._latitude = latitude;
        this._longitude = longitude;
    }

    ViewDetails() {
        console.log(`--- Clinic Details ---`);
        console.log(`Name:   ${this.ClinicName}`);
        console.log(`Address:${this.Address}`);
        console.log(`Phone:  ${this.PhoneNumber}`);
        console.log(`Hours:  ${this.OpeningHours}`);
        console.log(`-----------------------`);
        
        // Alternatively, return as an HTML string for your webpage:
        return `
            <h3>${this.ClinicName}</h3>
            <p><strong>Address:</strong> ${this.Address}</p>
            <p><strong>Phone:</strong> ${this.PhoneNumber}</p>
            <p><strong>Hours:</strong> ${this.OpeningHours}</p>
        `;
    }

    UpdateDetails(newDetails) {
        // newDetails should be an object, e.g., { PhoneNumber: '111-222-3333' }
        if (newDetails.ClinicName) this.ClinicName = newDetails.ClinicName;
        if (newDetails.Address) this.Address = newDetails.Address;
        if (newDetails.PhoneNumber) this.PhoneNumber = newDetails.PhoneNumber;
        if (newDetails.OpeningHours) this.OpeningHours = newDetails.OpeningHours;
        
        console.log(`Details for ${this.ClinicName} updated successfully.`);
    }

    GetDistance(targetLatitude, targetLongitude) {
        // Haversine formula to calculate distance between two lat/lng points (in kilometers)
        const R = 6371; // Earth radius in km
        const dLat = this._deg2rad(targetLatitude - this._latitude);
        const dLng = this._deg2rad(targetLongitude - this._longitude);

        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._deg2rad(this._latitude)) * Math.cos(this._deg2rad(targetLatitude)) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km

        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    // Helper method for Haversine formula
    _deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    toJSON() {
        return {
            ClinicName: this.ClinicName,
            Address: this.Address,
            PhoneNumber: this.PhoneNumber,
            OpeningHours: this.OpeningHours,
            latitude: this._latitude,
            longitude: this._longitude
        };
    }

    static fromJSON(obj) {
        if (!obj) return null;
        // Accept multiple possible key names for compatibility
        const lat = obj.latitude ?? obj.Latitude ?? obj._latitude ?? 0;
        const lon = obj.longitude ?? obj.Longitude ?? obj._longitude ?? 0;
        return new ClinicDetails(
            obj.ClinicName || obj.name || '',
            obj.Address || obj.address || '',
            obj.PhoneNumber || obj.phoneNumber || obj.phone || '',
            obj.OpeningHours || obj.openingHours || obj.hours || '',
            Number(lat),
            Number(lon)
        );
    }
}