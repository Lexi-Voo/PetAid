const STORAGE_KEY = "petaid_guides";

function loadGuides() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return parsed.map(guideData => FirstAidGuide.fromJSON(guideData));
}

function saveGuides(guides) {
    const data = guides.map(guide => guide.toJSON());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getGuidesByCategory(category) {
    const guides = loadGuides();
    return guides.filter(guide => guide.getCategory() === category);
}

function getGuideById(id) {
    const guides = loadGuides();
    return guides.find(guide => guide.getId() === id) || null;
}

const FORUM_STORAGE_KEY = "petaid_forum_posts";

function loadForumPosts() {
    const data = localStorage.getItem(FORUM_STORAGE_KEY);

    if (!data) {
        return [];
    }

    const parsed = JSON.parse(data);

    return parsed.map(postData => {
        const comments = (postData.comments || []).map(comment =>
            new Comment(
                comment.id,
                comment.userId,
                comment.content,
                new Date(comment.createdAt)
            )
        );

        return new ForumPost(
            postData.id,
            postData.userId,
            postData.category,
            postData.title,
            postData.content,
            new Date(postData.datePosted),
            comments,
            postData.status
        );
    });
}

function saveForumPosts(posts) {
    const plainData = posts.map(post => {

        const data = post.viewPost();

        return {
            ...data,

            comments: data.comments.map(comment =>
                comment.viewComment()
            )
        };
    });

    localStorage.setItem(
        FORUM_STORAGE_KEY,
        JSON.stringify(plainData)
    );
}

function getAllForumPosts() {
    return loadForumPosts();
}

function getForumPostsByCategory(category) {
    const posts = loadForumPosts();

    if (category === "all") {
        return posts;
    }

    return posts.filter(
        post => post.getCategory() === category
    );
}

function getForumPostById(postId) {
    return loadForumPosts().find(
        post => post.getId() === postId
    ) || null;
}