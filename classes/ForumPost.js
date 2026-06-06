class ForumPost {
    #id;
    #userId;
    #category;
    #title;
    #content;
    #datePosted;
    #comments;

    constructor(id, userId, category, title, content, datePosted = new Date(), comments = []) {
        this.#id = id;
        this.#userId = userId;
        this.#category = category;
        this.#title = title;
        this.#content = content;
        this.#datePosted = datePosted;
        this.#comments = comments;
    }

    getId() {
        return this.#id;
    }

    getDatePosted() {
        return this.#datePosted;
    }

    getComments() {
        return this.#comments;
    }

    addComment(comment) {
        this.#comments.push(comment);
    }

    removeComment(commentId) {
        this.#comments = this.#comments.filter(
            comment => comment.getId() !== commentId
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
            comments: this.#comments.map(c => c.viewComment())
        };
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

    toJSON() {
        return {
            id: this.#id,
            userId: this.#userId,
            category: this.#category,
            title: this.#title,
            content: this.#content,
            datePosted: this.#datePosted,
            comments: this.#comments.map(
                comment => comment.toJSON()
            )
        };
    }
}