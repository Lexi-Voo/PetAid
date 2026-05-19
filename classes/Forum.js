class Forum {
    #category;
    #title;
    #description;
    #posts;

    constructor(category, title, description, posts = []) {
        this.#category = category;
        this.#title = title;
        this.#description = description;
        this.#posts = posts;
    }

    getCategory() {
        return this.#category;
    }

    getTitle() {
        return this.#title;
    }

    getDescription() {
        return this.#description;
    }

    getPosts() {
        return this.#posts;
    }

    editForum(newData) {
        if (newData.category !== undefined) {
            this.#category = newData.category;
        }

        if (newData.title !== undefined) {
            this.#title = newData.title;
        }

        if (newData.description !== undefined) {
            this.#description = newData.description;
        }
    }

    viewForum() {
        return {
            category: this.#category,
            title: this.#title,
            description: this.#description,
            posts: this.#posts
        };
    }

    getPostById(postId) {
        return this.#posts.find(
            post => post.getId() === postId
        );
    }

    createPost(id, userId, category, title, content) {
        return new ForumPost(
            id,
            userId,
            category,
            title,
            content
        );
    }

    addPost(id, userId, category, title, content) {
        const newPost = this.createPost(id, userId, category, title, content);

        if (newPost.validateContent()) {
            this.#posts.unshift(newPost);
            return newPost;
        }

        return null;
    }

    deletePost(postId) {
        this.#posts = this.#posts.filter(
            post => post.getId() !== postId
        );
    }
}