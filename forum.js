// STATE
let selectedCategory = "all";
let currentOpenedPostId = null;

// INITIALIZATION
document.addEventListener("DOMContentLoaded", function () {
    loadForumSampleDataIfNeeded();

    setupCategoryFilter();

    setupModal();

    renderPosts("all");
});

// LOAD SAMPLE DATA
function loadForumSampleDataIfNeeded() {
    const existing = localStorage.getItem(FORUM_STORAGE_KEY);

    if (!existing) {
        fetch("data/sampleForumPosts.JSON")
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(
                    FORUM_STORAGE_KEY,
                    JSON.stringify(data)
                );

                renderPosts("all");
            })
            .catch(() => {
                console.log(
                    "Could not load sample forum data."
                );
            });
    }
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

    let posts =
        getForumPostsByCategory(category);

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
        return `
            <div 
                class="forum-post-card"
                onclick="openPostDetail('${data.id}')"
            >
                <div class="forum-post-header">
                    <div class="forum-user-info">
                        <img 
                            src="assets/images/profile.jpg"
                            class="forum-avatar"
                            alt="Profile"
                        >
                        <div>
                            <div class="forum-username-row">
                                <div class="forum-username">
                                    ${getDisplayName(data.userId)}
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
                        ${data.category}
                    </span>
                </div>

                <h3 class="forum-post-title">
                    ${data.title}
                </h3>

                <p class="forum-post-content">
                    ${data.content}
                </p>

                <div class="forum-post-footer">
                    <span>
                        💬 ${data.comments.length} comments
                    </span>
                </div>
            </div>
        `;

    }).join("");
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
                    ${getDisplayName(comment.getUserId())}
                </div>

                ${getRoleBadge(
                    getUserRole(comment.getUserId())
                )}
            </div>

            <div class="comment-date">
                ${formatDate(comment.getCreatedAt())}
            </div>

            <div class="comment-content">
                ${comment.getContent()}
            </div>

        </div>

    `).join("");
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

function clearModalFields() {
    document.getElementById("post-category").value = "dog";

    document.getElementById("post-title").value = "";

    document.getElementById("post-content").value = "";
}

// CREATE POST
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

    // validation
    if (!category || !title || !content) {
        showConfirmation(
            "Please fill in all fields.",
            true
        );

        return;
    }

    const posts = loadForumPosts();

    // temporary user
    const userId = "u001";

    const newPost = new ForumPost(
        generatePostId(),
        userId,
        category,
        title,
        content,
        new Date(),
        [],
        true
    );

    posts.unshift(newPost);

    saveForumPosts(posts);

    showConfirmation(
        "Forum post created successfully!"
    );

    closeModal();

    renderPosts(selectedCategory);
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

    const posts = loadForumPosts();

    const post = posts.find(
        p => p.getId() === currentOpenedPostId
    );

    if (!post) {
        return;
    }

    const newComment = new Comment(
        generateCommentId(),
        "u001",
        content,
        new Date()
    );

    post.addComment(newComment);

    saveForumPosts(posts);

    input.value = "";

    renderComments(post);

    renderPosts(selectedCategory);

    showConfirmation(
        "Comment added successfully!"
    );
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


function getUserData(userId) {
    const users = {
        u001: {
            name: "alex",
            role: "pet-owner"
        },

        u002: {
            name: "Dr. Sarah",
            role: "veterinarian"
        },

        u003: {
            name: "john",
            role: "pet-owner"
        },

        u004: {
            name: "emily",
            role: "pet-owner"
        }
    };

    return users[userId] || {
        name: "anonymous",
        role: "pet-owner"
    };
}

function getDisplayName(userId) {
    return getUserData(userId).name;
}

function getUserRole(userId) {
    return getUserData(userId).role;
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