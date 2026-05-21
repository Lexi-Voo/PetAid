class UserProfile {
    #name;
    #biography;
    #profilePic;

    constructor(name, biography = "", profilePic = "assets/profiles/profile.jpg") {
        this.#name = name;
        this.#biography = biography;
        this.#profilePic = profilePic;
    }

    getName() { return this.#name; }
    getBiography() { return this.#biography; }
    getProfilePic() { return this.#profilePic; }

    setName(name) { this.#name = name; }
    setBiography(bio) { this.#biography = bio; }
    setProfilePic(pic) { this.#profilePic = pic; }

    toObject() {
        return {
            name: this.#name,
            biography: this.#biography,
            profile_pic: this.#profilePic
        };
    }
}