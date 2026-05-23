class UserProfile {
    #name;
    #biography;
    #profilePic;
    #phoneNumber; 

    constructor(name, biography = "", profilePic = "assets/profiles/profile.jpg", phoneNumber = "") {
        this.#name = name;
        this.#biography = biography;
        this.#profilePic = profilePic;
        this.#phoneNumber = phoneNumber;
    }

    getName() { return this.#name; }
    getBiography() { return this.#biography; }
    getProfilePic() { return this.#profilePic; }
    getPhoneNumber() { return this.#phoneNumber; } 

    setName(name) { this.#name = name; }
    setBiography(bio) { this.#biography = bio; }
    setProfilePic(pic) { this.#profilePic = pic; }
    setPhoneNumber(phone) { this.#phoneNumber = phone; } 
    viewProfile() {
        return {
            name: this.getName(),
            bio: this.getBiography(),
            profilePicture: this.getProfilePic(),
            phoneNumber: this.getPhoneNumber()
        };
    }

    updateProfile(newData) {
        if (newData.name !== undefined) this.setName(newData.name);
        if (newData.biography !== undefined) this.setBiography(newData.biography);
        if (newData.profilePic !== undefined) this.setProfilePic(newData.profilePic);
        if (newData.phoneNumber !== undefined) this.setPhoneNumber(newData.phoneNumber);
    }

    toObject() {
        return {
            name: this.#name,
            biography: this.#biography,
            profile_pic: this.#profilePic,
            phone_number: this.#phoneNumber
        };
    }
}