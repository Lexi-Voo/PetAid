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

    static fromJSON(data) {
        if (!Array.isArray(data)) {
            return new Forum();
        }
        const posts = data.map(postData => {
            const comments = (postData.comments || []).map(
                c => new Comment(c.id, c.userId, c.content, new Date(c.createdAt))
            );

            return new ForumPost(postData.id, postData.userId, postData.category, postData.title, postData.content, new Date(postData.datePosted), comments);
        });

        return new Forum(posts);
    }

    toJSON() {
        return this.#posts.map(
            post => post.toJSON()
        );
    }
}