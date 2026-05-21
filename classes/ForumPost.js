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
            this.#title &&
            this.#title.trim() !== "" &&
            this.#content &&
            this.#content.trim() !== "" &&
            this.#category &&
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
}