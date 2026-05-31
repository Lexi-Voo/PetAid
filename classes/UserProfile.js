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
 
    viewProfile() {
        return {
            name: this.getName(),
            bio: this.getBiography(),
            profilePicture: this.getProfilePic(),
            phoneNumber: this.getPhoneNumber()
        };
    }

    updateProfile(newData) {
        if (newData.name !== undefined) this.#name = newData.name;
        if (newData.biography !== undefined) this.#biography = newData.biography;
        if (newData.profilePic !== undefined) this.#profilePic = newData.profilePic;
        if (newData.phoneNumber !== undefined) this.#phoneNumber = newData.phoneNumber;
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