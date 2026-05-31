class Pet {
    #petId;
    #ownerId;
    #name;
    #category;
    #petBio;
    #petImg;

    constructor(petId, ownerId, name, category, petBio = "", petImg = "assets/petprofile/dog.jpg") {
        this.#petId = petId;
        this.#ownerId = ownerId;
        this.#name = name;
        this.#category = category;
        this.#petBio = petBio;
        this.#petImg = petImg;
    }

    getPetId() { return this.#petId; }
    getOwnerId() { return this.#ownerId; }
    getName() { return this.#name; }
    getCategory() { return this.#category; }
    getPetBio() { return this.#petBio; }
    getPetImg() { return this.#petImg; }

    setPetImg(img) { this.#petImg = img; }

    updateDetails(newData) {
        if (newData.name !== undefined) this.#name = newData.name;
        if (newData.category !== undefined) this.#category = newData.category;
        if (newData.petBio !== undefined) this.#petBio = newData.petBio;
        if (newData.petImg !== undefined) this.#petImg = newData.petImg;
    }

    toJSON() {
        return {
            pet_id: this.getPetId(),
            owner_id: this.getOwnerId(),
            name: this.getName(),
            category: this.getCategory(),
            pet_bio: this.getPetBio(),
            pet_img: this.getPetImg()
        };
    }
}