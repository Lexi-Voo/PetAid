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

    deleteForum() {
        this.#posts = [];
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
        ) || null;
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
        const newPost = this.createPost(
            id,
            userId,
            category,
            title,
            content
        );

        if (!newPost.validateContent()) {
            return null;
        }

        this.#posts.unshift(newPost);

        return newPost;
    }

    editPost(postId, newData) {
        const post = this.getPostById(postId);

        if (!post) {
            return false;
        }

        post.editPost(newData);

        return true;
    }

    deletePost(postId) {
        const post = this.getPostById(postId);

        if (!post) {
            return false;
        }

        post.deletePost();

        return true;
    }
}