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

const USERS_KEY = "petaid_users";
const APPROVALS_KEY = "petaid_approvals";
const PETS_KEY = "petaid_pets";

function loadAuthUsers() {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAuthUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    fetch('/api/save-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
    })
    .then(res => res.json())
    .then(data => console.log("Disk Sync:", data.message))
    .catch(err => console.error("Could not sync to physical user.JSON file:", err));
}

function findAuthUserByUsername(username) {
    const users = loadAuthUsers();
    return users.find(u => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

function findAuthUserById(id) {
    const users = loadAuthUsers();
    return users.find(u => u.user_id === id) || null;
}

function loadApprovals() {
    const data = localStorage.getItem(APPROVALS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveApprovals(approvals) {
    localStorage.setItem(APPROVALS_KEY, JSON.stringify(approvals));
    
    fetch('/api/save-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvals)
    })
    .then(res => res.json())
    .then(data => console.log("Disk Sync:", data.message))
    .catch(err => console.error("Could not sync to physical approvals.JSON file:", err));
}

function findApprovalByUsername(username) {
    const approvals = loadApprovals();
    return approvals.find(a => a.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

function loadPets() {
    const data = localStorage.getItem(PETS_KEY);
    return data ? JSON.parse(data) : [];
}

function getPetsByOwnerId(ownerId) {
    const pets = loadPets();
    return pets.filter(pet => pet.owner_id === ownerId);
}

function savePets(pets) {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
    fetch('/api/save-pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pets)
    })
    .then(res => res.json())
    .then(data => console.log("Disk Sync:", data.message))
    .catch(err => console.error("Could not sync to physical pets.JSON file:", err));
}

async function initializeAllStorage() {
    console.log("StorageHelper: Synchronizing system data configurations...");
    if (!localStorage.getItem(USERS_KEY)) {
        try {
            const response = await fetch('data/user.JSON');
            const initialUsers = await response.json();
            localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
            console.log("StorageHelper: Successfully seeded active user registries.");
        } catch (err) {
            console.warn("StorageHelper: user.JSON fallback active.", err);
        }
    }

    if (!localStorage.getItem(APPROVALS_KEY)) {
        try {
            const response = await fetch('data/approvals.JSON');
            const initialApprovals = await response.json();
            localStorage.setItem(APPROVALS_KEY, JSON.stringify(initialApprovals));
            console.log("StorageHelper: Successfully seeded pending veterinarian verification queue.");
        } catch (err) {
            console.warn("StorageHelper: approvals.JSON fallback active.", err);
        }
    }

    if (!localStorage.getItem(PETS_KEY)) {
        try {
            const response = await fetch('data/pets.JSON');
            const initialPets = await response.json();
            localStorage.setItem(PETS_KEY, JSON.stringify(initialPets));
            console.log("StorageHelper: Successfully seeded initial pet metrics tracking dataset.");
        } catch (err) {
            console.warn("StorageHelper: pets.JSON fallback active.", err);
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await initializeAllStorage();

    await initializeQuizStorage();
});

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

// ============================================= Quiz Helper ===================================================================
const QUIZ_STORAGE_KEY = "petaid_quizzes";

function loadQuizzes() {
    const data = localStorage.getItem(QUIZ_STORAGE_KEY);

    if (!data) {
        return [];
    }

    const parsed = JSON.parse(data);

    return parsed.map(quizData => {

        const questions = (quizData.questions || []).map(question =>
            new QuizQuestion(
                question.id,
                question.questionText,
                question.options,
                question.correctAnswer
            )
        );

        return new Quiz(
            quizData.id,
            quizData.title,
            quizData.category,
            questions,
            quizData.score || 0
        );
    });
}

function saveQuizzes(quizzes) {
    const plainData = quizzes.map(quiz => {
        return {
            id: quiz.getId(),
            title: quiz.getTitle(),
            category: quiz.getCategory(),
            score: quiz.getScore().score,
            questions: quiz.getQuestions().map(q => ({
                id: q.id,
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer
            }))
        };
    });

    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(plainData));

    fetch('http://localhost:3000/api/save-quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plainData)
    })
    .then(res => res.json())
    .then(data => console.log("Disk Sync:", data.message))
    .catch(err => console.error("Could not sync quizzes.JSON file:", err));
}

function getAllQuizzes() {
    return loadQuizzes();
}

function getQuizzesByCategory(category) {
    const quizzes = loadQuizzes();

    return quizzes.filter(
        quiz => quiz.getCategory() === category
    );
}

function getQuizById(quizId) {
    return loadQuizzes().find(
        quiz => quiz.getId() === quizId
    ) || null;
}

async function initializeQuizStorage() {
    if (!localStorage.getItem(QUIZ_STORAGE_KEY)) {
        try {
            const response = await fetch("data/sampleQuizzes.json");

            const initialQuizzes = await response.json();

            localStorage.setItem(
                QUIZ_STORAGE_KEY,
                JSON.stringify(initialQuizzes)
            );

            console.log("StorageHelper: Quiz dataset initialized.");

        } catch (err) {
            console.warn("StorageHelper: sampleQuizzes.json fallback active.", err);
        }
    }
}