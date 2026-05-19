class User {
    #id;
    #profile;
    #email;
    #password;
    #role;

    constructor(id, profile, email, password, role) {
        this.#id = id;
        this.#profile = profile;
        this.#email = email;
        this.#password = password;
        this.#role = role;
    }

    getId() {
        return this.#id;
    }

    getProfile() {
        return this.#profile;
    }

    getEmail() {
        return this.#email;
    }

    getRole() {
        return this.#role;
    }

    browseGuide(category) {
        return getGuidesByCategory(category);
    }

    submitForumPost(forum, postData) {
        return forum.addPost(
            postData.id,
            this.#id,
            postData.category,
            postData.title,
            postData.content
        );
    }

    editForumPost(post, newData) {
        post.editPost(newData);
    }

    deleteForumPost(post) {
        post.deletePost();
    }

    addComment(post, commentData) {
        const comment = new Comment(
            commentData.id,
            this.#id,
            commentData.content
        );

        post.addComment(comment);
    }

    getDisplayName() {
        return this.#email.split("@")[0];
    }
}