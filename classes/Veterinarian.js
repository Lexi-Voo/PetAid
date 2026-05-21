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