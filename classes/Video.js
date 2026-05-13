class Video {
    #title;
    #url;

    constructor(title, url) {
        this.#title = title;
        this.#url = url;
    }

    getTitle() {
        return this.#title;
    }

    getURL() {
        return this.#url;
    }

    viewVideo() {
        return {
            title: this.#title,
            url: this.#url
        };
    }

    playVideo() {
        window.open(this.#url, "_blank");
    }

    editVideo(newData) {
        if (newData.title !== undefined) {
            this.#title = newData.title;
        }
        if (newData.url !== undefined) {
            this.#url = newData.url;
        }
    }

    toJSON() {
        return {
            title: this.#title,
            url: this.#url
        };
    }
}