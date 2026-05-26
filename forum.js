// STATE
let selectedCategory = "all";
let currentOpenedPostId = null;
let forum = null;
let editingPostId = null;

// INITIALIZATION
document.addEventListener("DOMContentLoaded", async function () {
    await loadForumSampleDataIfNeeded();

    forum = loadForum();

    renderNavbar("Forum");
    renderFooter();

    setupCategoryFilter();
    setupModal();

    renderPosts("all");
});

// LOAD SAMPLE DATA
async function loadForumSampleDataIfNeeded() {
    const existing =
        localStorage.getItem(FORUM_STORAGE_KEY);

    if (!existing) {

        try {

            const response =
                await fetch("data/forum.JSON");

            const data =
                await response.json();

            localStorage.setItem(
                FORUM_STORAGE_KEY,
                JSON.stringify(data)
            );

        } catch {

            console.log(
                "Could not load sample forum data."
            );
        }
    }
}

function loadForum() {
    const raw = loadForumPosts(); // existing function

    return new Forum(
        "pet-forum",
        "Pet Forum",
        "Community discussion",
        raw
    );
}

// CATEGORY FILTER
function setupCategoryFilter() {
    const categoryItems =
        document.querySelectorAll("#forum-categories li");

    categoryItems.forEach(item => {
        item.addEventListener("click", function () {
            categoryItems.forEach(li =>
                li.classList.remove("active")
            );

            this.classList.add("active");

            selectedCategory =
                this.dataset.category;

            renderPosts(selectedCategory);
        });
    });
}

// RENDER POSTS
function renderPosts(category = "all") {
    const container =
        document.getElementById("posts-container");

    let posts = forum.getPosts();

    if (category !== "all") {
        posts = posts.filter(
            p =>
                p.getStatus() &&
                p.getCategory() === category
        );
    }
    else {
        posts = posts.filter(
            p => p.getStatus()
        );
    }

    // newest first
    posts.sort((a, b) =>
        b.getDatePosted() - a.getDatePosted()
    );

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-posts">
                <div class="empty-posts-icon">
                    💬
                </div>
                <h3>No forum posts yet</h3>
                <p>
                    Be the first to start a discussion in this category.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = posts.map(post => {
        const data = post.viewPost();
        const currentUser = getCurrentUser();

        const isOwner =
            currentUser &&
            currentUser.getId() === data.userId;

        return `
            <div 
                class="
                    forum-post-card
                    ${isOwner ? "my-post" : ""}
                "
                onclick="openPostDetail('${data.id}')"
            >
                <div class="forum-post-header">
                    <div class="forum-user-info">
                        <img 
                            src="${getUserProfilePic(data.userId)}"
                            class="forum-avatar"
                            alt="Profile"
                        >
                        <div>
                            <div class="forum-username-row">
                                <div class="forum-username">
                                    ${escapeHTML(getDisplayName(data.userId))}
                                </div>

                                ${getRoleBadge(
                                    getUserRole(data.userId)
                                )}
                            </div>
                            <div class="forum-meta">
                                ${formatDate(data.datePosted)}
                            </div>
                        </div>
                    </div>
                    <span class="forum-category-badge">
                        ${escapeHTML(data.category)}
                    </span>
                </div>

                <h3 class="forum-post-title">
                    ${escapeHTML(data.title)}
                </h3>

                <p class="forum-post-content">
                    ${escapeHTML(data.content)}
                </p>

                <div class="forum-post-footer">
                    <div class="post-stats">
                        💬 ${data.comments.length} comments
                    </div>

                    ${renderPostActions(post)}

                </div>
            </div>
        `;

    }).join("");
}

function getUserProfilePic(userId) {
    const user = getUserById(userId);

    return user
        ? user.getProfile().getProfilePic()
        : "assets/profiles/profile.jpg";
}

function openPostDetail(postId) {
    currentOpenedPostId = postId;

    const post = getForumPostById(postId);

    if (!post) {
        return;
    }

    const data = post.viewPost();

    document.getElementById(
        "detail-post-title"
    ).textContent = data.title;

    document.getElementById(
        "detail-post-user"
    ).textContent = getDisplayName(data.userId);

    document.getElementById(
        "detail-post-date"
    ).textContent = formatDate(data.datePosted);

    document.getElementById(
        "detail-post-content"
    ).textContent = data.content;

    renderComments(post);

    document
        .getElementById("post-detail-modal")
        .classList.add("active");
}

function renderComments(post) {
    const container =
        document.getElementById(
            "comments-container"
        );

    const comments = post.getComments();

    if (comments.length === 0) {

        container.innerHTML = `
            <div class="empty-posts">
                No comments yet.
            </div>
        `;

        return;
    }

    container.innerHTML = comments.map(comment => `
        <div class="comment-card">
            <div class="comment-user-row">
                <div class="comment-user">
                    ${escapeHTML(getDisplayName(comment.getUserId()))}
                </div>

                ${getRoleBadge(
                    getUserRole(comment.getUserId())
                )}
            </div>

            <div class="comment-date">
                ${formatDate(comment.getCreatedAt())}
            </div>

            <div class="comment-content">
                ${escapeHTML(comment.getContent())}
            </div>

            <div class="comment-footer">
                <div class="comment-actions">
                    ${renderCommentActions(comment)}
                </div>
            </div>

        </div>

    `).join("");
}

function renderCommentActions(comment) {
    const currentUser =
        getCurrentUser();

    if (!currentUser) return "";

    if (!comment.canDelete(currentUser))
        return "";

    return `
        <button
            class="icon-btn delete-btn"
            onclick="
                deleteComment(
                    '${currentOpenedPostId}',
                    '${comment.getId()}'
                )
            "
            title="Delete Comment"
        >
            🗑️
        </button>
    `;
}

function deleteComment(postId, commentId) {
    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        showConfirmation(
            "Please login first.",
            true
        );

        return;
    }

    const posts =
        forum.getPosts();

    const post =
        posts.find(
            p => p.getId() === postId
        );

    if (!post) return;

    const comment =
        post.getComments().find(
            c => c.getId() === commentId
        );

    if (!comment) return;

    // permission check
    if (!comment.canDelete(currentUser)) {

        showConfirmation(
            "Permission denied.",
            true
        );

        return;
    }

    post.removeComment(commentId);

    saveForumPosts(posts);

    renderComments(post);

    renderPosts(selectedCategory);

    showConfirmation(
        "Comment deleted."
    );
}

// MODAL
function setupModal() {
    const modal =
        document.getElementById("post-modal");

    const openBtn =
        document.getElementById("create-post-btn");

    const cancelBtn =
        document.getElementById("cancel-post");

    openBtn.addEventListener("click", function () {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            showConfirmation(
                "Please login first.",
                true
            );
            return;
        }

        modal.classList.add("active");
    });

    cancelBtn.addEventListener("click", function () {
        closeModal();
    });

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    document
        .getElementById("submit-post")
        .addEventListener("click", createPost);

    document
        .getElementById("close-detail-modal")
        .addEventListener("click", function () {

            document
                .getElementById("post-detail-modal")
                .classList.remove("active");
        });

    document
        .getElementById("submit-comment-btn")
        .addEventListener("click", submitComment);
}

function closeModal() {
    document
        .getElementById("post-modal")
        .classList.remove("active");

    clearModalFields();
}

// CREATE POST + EDIT POST
function createPost() {
    const category =
        document.getElementById("post-category").value;

    const title =
        document.getElementById("post-title")
            .value
            .trim();

    const content =
        document.getElementById("post-content")
            .value
            .trim();

    if (!category || !title || !content) {

        showConfirmation(
            "Please fill in all fields.",
            true
        );

        return;
    }

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        showConfirmation(
            "Please login first.",
            true
        );

        return;
    }

    // EDIT MODE
    if (editingPostId) {

        const post =
            forum.getPostById(editingPostId);

        if (!post) return;

        if (!post.canEdit(currentUser)) {

            showConfirmation(
                "Permission denied.",
                true
            );

            return;
        }

        post.editPost({
            title,
            content,
            category
        });

        showConfirmation(
            "Post updated successfully!"
        );

        editingPostId = null;
    }

    // CREATE MODE
    else {

        forum.addPost(
            generatePostId(),
            currentUser.getId(),
            category,
            title,
            content
        );

        showConfirmation(
            "Forum post created successfully!"
        );
    }

    saveForumPosts(
        forum.getPosts()
    );

    closeModal();

    renderPosts(selectedCategory);

    if (currentOpenedPostId) {
        openPostDetail(currentOpenedPostId);
    }
}

function clearModalFields() {
    editingPostId = null;

    document.getElementById(
        "modal-title"
    ).textContent = "Create Forum Post";

    document.getElementById(
        "submit-post"
    ).textContent = "Post";

    document.getElementById(
        "post-category"
    ).value = "dog";

    document.getElementById(
        "post-title"
    ).value = "";

    document.getElementById(
        "post-content"
    ).value = "";
}

// SUBMIT COMMENT
function submitComment() {
    const input =
        document.getElementById("comment-input");

    const content =
        input.value.trim();

    if (!content) {

        showConfirmation(
            "Comment cannot be empty.",
            true
        );

        return;
    }

    const posts = forum.getPosts();

    const post = posts.find(
        p => p.getId() === currentOpenedPostId
    );

    if (!post) {
        return;
    }

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        showConfirmation(
            "Please login first.",
            true
        );

        return;
    }

    const newComment = new Comment(
        generateCommentId(),
        currentUser.getId(),
        content,
        new Date()
    );

    post.addComment(newComment);

    saveForumPosts(forum.getPosts());

    input.value = "";

    renderComments(post);

    renderPosts(selectedCategory);

    showConfirmation(
        "Comment added successfully!"
    );
}

function renderPostActions(post) {
    const currentUser =
        getCurrentUser();

    if (!currentUser) return "";

    const canEdit =
        post.canEdit(currentUser);

    const canDelete =
        post.canDelete(currentUser);

    if (!canEdit && !canDelete)
        return "";

    return `
        <div class="forum-post-actions">

            ${canEdit ? `
                <button
                    class="icon-btn edit-btn"
                    onclick="
                        event.stopPropagation();
                        openEditModal('${post.getId()}')
                    "
                    title="Edit Post"
                >
                    ✏️
                </button>
            ` : ""}

            ${canDelete ? `
                <button
                    class="icon-btn delete-btn"
                    onclick="
                        event.stopPropagation();
                        deletePost('${post.getId()}')
                    "
                    title="Delete Post"
                >
                    🗑️
                </button>
            ` : ""}

        </div>
    `;
}

function deletePost(postId) {
    const currentUser =
        getCurrentUser();

    const posts =
        forum.getPosts();

    const post =
        posts.find(
            p => p.getId() === postId
        );

    if (!post) return;

    if (!post.canDelete(currentUser)) {

        showConfirmation(
            "Permission denied.",
            true
        );

        return;
    }

    forum.deletePost(postId);

    saveForumPosts(forum.getPosts());

    renderPosts(selectedCategory);

    showConfirmation(
        "Post deleted successfully."
    );
}

function openEditModal(postId) {
    const post =
        forum.getPostById(postId);

    if (!post) return;

    editingPostId = postId;

    document.getElementById(
        "post-category"
    ).value = post.getCategory();

    document.getElementById(
        "post-title"
    ).value = post.getTitle();

    document.getElementById(
        "post-content"
    ).value = post.getContent();

    document.getElementById(
        "modal-title"
    ).textContent = "Edit Forum Post";

    document.getElementById(
        "submit-post"
    ).textContent = "Save Changes";

    document
        .getElementById("post-modal")
        .classList.add("active");
}

// HELPERS
function generatePostId() {
    return "p" + Date.now();
}

function generateCommentId() {
    return "c" + Date.now();
}


function formatDate(date) {
    const formatted =
        new Date(date);

    return formatted.toLocaleString();
}

function getUserById(userId) {

    const users =
        loadAuthUsers();

    return users.find(
        u => u.getId() === userId
    );
}

function getDisplayName(userId) {

    const user =
        getUserById(userId);

    return user
        ? user.getDisplayName()
        : "Unknown";
}

function getUserRole(userId) {

    const user =
        getUserById(userId);

    return user
        ? user.getRole()
        : "petowner";
}

function getRoleBadge(role) {

    if (role === "veterinarian") {
        return `
            <span class="role-badge vet-badge">
                Veterinarian
            </span>
        `;
    }

    return `
        <span class="role-badge owner-badge">
            Pet Owner
        </span>
    `;
}

function escapeHTML(text) {
    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}