class User {
    #id;
    #profile; 
    #username;
    #password;
    #email;  
    #role;

    constructor(id, profile, username, password, email, role) {
        this.#id = id;
        this.#profile = profile; 
        this.#username = username;
        this.#password = password;
        this.#email = email;
        this.#role = role;
    }

    getId() { return this.#id; }
    getProfile() { return this.#profile; }
    getUsername() { return this.#username; }
    getPassword() { return this.#password; }
    getEmail() { return this.#email; } 
    getRole() { return this.#role; }

    browseGuide(category) {
        return getGuidesByCategory(category);
    }

    submitForumPost(forum, postData) {
        return forum.addPost(
            postData.id,
            this.getId(), 
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
            this.getId(),
            commentData.content
        );
        post.addComment(comment);
    }

    getDisplayName() {
        return this.getUsername();
    }

    toJSON() {
        const data = {
        user_id: this.getId(),
        username: this.getUsername(),
        password: this.getPassword(),
        name: this.getProfile().getName(),
        email: this.getEmail(),
        role: this.getRole(),
        biography: this.getProfile().getBiography(),
        profile_pic: this.getProfile().getProfilePic()
        };
        if (typeof this.getPhone === 'function') {
            data.phone = this.getPhone();
        }
        return data;
    }
}