class User {
    #profile;
    #email;
    #password;
    #role;

    constructor(profile, email, password, role) {
        this.#profile = profile;
        this.#email = email;
        this.#password = password;
        this.#role = role;
    }

    getProfile() {
        return this.#profile;
    }

    getEmail() {
        return this.#email;
    }

    getRole() {
        return this.#role;
    }

    browseGuide(category) {
        return getGuidesByCategory(category);
    }
}