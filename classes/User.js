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

    login() {
        localStorage.setItem('petaid_active_session', JSON.stringify(this.toJSON()));
    }

    logout() {
        localStorage.removeItem('petaid_active_session');
    }

    register() {
        throw new Error("Method 'register()' must be implemented by concrete user subclasses.");
    }

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
            commentData.commentContent || commentData.content
        );
        post.addComment(comment);
    }

    getDisplayName() {
        return this.getUsername();
    }

    static authenticate(inputUsername, inputPassword) {
        const savedUsers = loadAuthUsers(); 
        const savedApprovals = loadApprovals();
        const matchedUser = savedUsers.find(u => 
            (u.getUsername() && u.getUsername().toLowerCase() === inputUsername.toLowerCase()) ||
            (u.getEmail() && u.getEmail().toLowerCase() === inputUsername.toLowerCase())
        );

        if (matchedUser) {
            if (matchedUser.getPassword() === inputPassword) {
                return { success: true, user: matchedUser }; 
            } else {
                return { success: false, message: "Invalid username or password." };
            }
        }
        const isPendingVet = savedApprovals.some(a => 
            (a.username && a.username.toLowerCase() === inputUsername.toLowerCase()) ||
            (a.email && a.email.toLowerCase() === inputUsername.toLowerCase())
        );
        if (isPendingVet) {
            return { success: false, message: "Your veterinary registration is still pending administrator review." };
        }
        return { success: false, message: "Invalid username or password." };
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