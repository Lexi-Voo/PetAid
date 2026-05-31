class Forum {
    #posts;

    constructor(posts = []) {
        this.#posts = posts;
    }

    getPosts() {
        return this.#posts;
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
            return false;
        }

        this.#posts.unshift(newPost);

        return true;
    }

    editPost(postId, newData) {
        const post = this.getPostById(postId);

        if (!post) {
            return false;
        }

        const current = post.viewPost();

        const tempPost = new ForumPost(
            current.id,
            current.userId,
            newData.category ?? current.category,
            newData.title ?? current.title,
            newData.content ?? current.content,
            current.datePosted,
            post.getComments()
        );

        if (!tempPost.validateContent()) {
            return false;
        }

        post.editPost(newData);
        return true;
    }

    deletePost(postId) {
        const originalLength = this.#posts.length;

        this.#posts = this.#posts.filter(
            post => post.getId() !== postId
        );

        return this.#posts.length < originalLength;
    }
}