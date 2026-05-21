class Comment {
    #id;
    #userId;
    #content;
    #createdAt;

    constructor(id, userId, content, createdAt = new Date()) {
        this.#id = id;
        this.#userId = userId;
        this.#content = content;
        this.#createdAt = createdAt;
    }

    getId() {
        return this.#id;
    }

    getUserId() {
        return this.#userId;
    }

    getContent() {
        return this.#content;
    }

    getCreatedAt() {
        return this.#createdAt;
    }

    editComment(newContent) {
        if (!newContent || newContent.trim() === "") {
            return false;
        }

        this.#content = newContent.trim();
        return true;
    }

    viewComment() {
        return {
            id: this.#id,
            userId: this.#userId,
            content: this.#content,
            createdAt: this.#createdAt
        };
    }
}