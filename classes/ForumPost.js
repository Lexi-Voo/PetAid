class ForumPost {
    #id;
    #userId;
    #category;
    #title;
    #content;
    #datePosted;
    #comments;
    #status;

    constructor(id, userId, category, title, content, datePosted = new Date(), comments = [], status = true) {
        this.#id = id;
        this.#userId = userId;
        this.#category = category;
        this.#title = title;
        this.#content = content;
        this.#datePosted = datePosted;
        this.#comments = comments;
        this.#status = status;
    }

    getId() {
        return this.#id;
    }

    getUserId() {
        return this.#userId;
    }

    getCategory() {
        return this.#category;
    }

    getTitle() {
        return this.#title;
    }

    getContent() {
        return this.#content;
    }

    getDatePosted() {
        return this.#datePosted;
    }

    getComments() {
        return this.#comments;
    }

    getStatus() {
        return this.#status;
    }

    addComment(comment) {
        this.#comments.push(comment);
    }

    removeComment(commentId) {
        this.#comments = this.#comments.filter(
            comment => comment.getId() !== commentId
        );
    }

    getCommentCount() {
        return this.#comments.length;
    }

    editPost(newData) {
        if (newData.title !== undefined) {
            this.#title = newData.title;
        }

        if (newData.category !== undefined) {
            this.#category = newData.category;
        }

        if (newData.content !== undefined) {
            this.#content = newData.content;
        }

        if (newData.status !== undefined) {
            this.#status = newData.status;
        }
    }

    deletePost() {
        this.#status = false;
    }

    validateContent() {
        return (
            typeof this.#title === "string" &&
            this.#title.trim() !== "" &&

            typeof this.#content === "string" &&
            this.#content.trim() !== "" &&

            typeof this.#category === "string" &&
            this.#category.trim() !== ""
        );
    }

    viewPost() {
        return {
            id: this.#id,
            userId: this.#userId,
            category: this.#category,
            title: this.#title,
            content: this.#content,
            datePosted: this.#datePosted,
            comments: this.#comments,
            status: this.#status
        };
    }

    isOwnedBy(userId) {
        return this.#userId === userId;
    }

    canEdit(user) {
        if (!user) return false;

        return (
            user.getRole() === "admin" ||
            user.getId() === this.#userId
        );
    }

    canDelete(user) {
        if (!user) return false;

        return (
            user.getRole() === "admin" ||
            user.getId() === this.#userId
        );
    }
}