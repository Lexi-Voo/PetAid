class Veterinarian extends User {
    cert_path;

    constructor(id, profile, username, password, email) {
        super(id, profile, username, password, email, "veterinarian");
        this.cert_path = "assets/certs/cert_1.jpg"; 
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
            biography: this.getProfile().getBiography(),
            profile_pic: this.getProfile().getProfilePic()
        };
    }
}