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

    viewComment() {
        return {
            id: this.#id,
            userId: this.#userId,
            content: this.#content,
            createdAt: this.#createdAt
        };
    }

    isOwnedBy(userId) {
        return this.#userId === userId;
    }

    canDelete(user) {
        if (!user) return false;

        return (
            user.getRole() === "admin" ||
            user.getId() === this.#userId
        );
    }
}