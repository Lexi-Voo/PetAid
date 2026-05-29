class Veterinarian extends User {
    cert_path;
    #phone; 

    constructor(id, profile, username, password, email, phone = "") {
        super(id, profile, username, password, email, "veterinarian");
        this.cert_path = "assets/certs/cert_1.jpg";
        this.#phone = phone; 
    }

    getPhone() { return this.#phone; }
    setPhone(phone) { this.#phone = phone; }

    async register(assignedCertPath) {
        this.cert_path = assignedCertPath || "assets/certs/cert_1.jpg";
        const savedApprovals = await loadApprovals();
        const newApprovalRequest = {
            "req_id": (savedApprovals.length + 1).toString(),
            "username": this.getUsername(),
            "password": this.getPassword(),
            "name": this.getProfile().getName(),
            "email": this.getEmail(), 
            "phone": this.getPhone(),
            "cert_path": this.cert_path, 
            "biography": this.getProfile().getBiography() || "Approved Vet.",
            "applied_at": new Date().toISOString().split('T')[0] 
        };

        savedApprovals.push(newApprovalRequest);
        await saveApprovals(savedApprovals);
    }

    toJSON() {
        return {
            user_id: this.getId(),
            username: this.getUsername(),
            password: this.getPassword(),
            name: this.getProfile().getName(),
            email: this.getEmail(),
            role: this.getRole(),
            cert_path: this.cert_path || "assets/certs/cert_1.jpg", 
            phone: this.getPhone(), 
            biography: this.getProfile().getBiography(),
            profile_pic: this.getProfile().getProfilePic()
        };
    }
}
