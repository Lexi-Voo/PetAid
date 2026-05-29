// ============================================= Guides =============================================
async function loadGuides() {
    try {
        const res = await fetch('data/sampleGuides.JSON?t=' + Date.now());
        const parsed = await res.json();
        return parsed.map(guideData => FirstAidGuide.fromJSON(guideData));
    } catch (err) {
        console.warn("Failed to load guides:", err);
        return [];
    }
}

async function saveGuides(guides) {
    const data = guides.map(guide => guide.toJSON());
    try {
        const res = await fetch('/api/save-guides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.error("Could not sync to sampleGuides.JSON:", err);
    }
}

async function getGuidesByCategory(category) {
    const guides = await loadGuides();
    return guides.filter(guide => guide.getCategory() === category);
}

async function getGuideById(id) {
    const guides = await loadGuides();
    return guides.find(guide => guide.getId() === id) || null;
}

// ============================================= Users =============================================
async function loadAuthUsers() {
    try {
        const res = await fetch('data/user.JSON?t=' + Date.now());
        const rawObjectsArray = await res.json();
        return rawObjectsArray.map(u => {
            const profileInstance = new UserProfile(u.name || "", u.biography || "", u.profile_pic || "assets/profiles/profile.jpg");
            const resolvedId = (u.user_id || "0").toString();
            const role = (u.role || "petowner").toLowerCase();
            if (role === 'admin') {
                return new Admin(resolvedId, profileInstance, u.username, u.password, u.email);
            } else if (role === 'veterinarian') {
                const vetInstance = new Veterinarian(resolvedId, profileInstance, u.username, u.password, u.email, u.phone || "");
                vetInstance.cert_path = u.cert_path || "assets/certs/cert_1.jpg";
                return vetInstance;
            } else {
                return new PetOwner(resolvedId, profileInstance, u.username, u.password, u.email);
            }
        });
    } catch (err) {
        console.warn("Failed to load users:", err);
        return [];
    }
}

async function saveAuthUsers(users) {
    try {
        const res = await fetch('/api/save-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(users)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.error("Could not sync to user.JSON:", err);
    }
}

async function findAuthUserByEmail(email) {
    const users = await loadAuthUsers();
    return users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

async function findAuthUserById(id) {
    const users = await loadAuthUsers();
    return users.find(u => u.user_id === id) || null;
}

// ============================================= Approvals =============================================
async function loadApprovals() {
    try {
        const res = await fetch('data/approvals.JSON?t=' + Date.now());
        return await res.json();
    } catch (err) {
        console.warn("Failed to load approvals:", err);
        return [];
    }
}

async function saveApprovals(approvals) {
    try {
        const res = await fetch('/api/save-approvals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(approvals)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.error("Could not sync to approvals.JSON:", err);
    }
}

async function findApprovalByEmail(email) {
    const approvals = await loadApprovals();
    return approvals.find(a => a.email && a.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

// ============================================= Pets =============================================
async function loadPets() {
    try {
        const res = await fetch('data/pets.JSON?t=' + Date.now());
        const parsedList = await res.json();
        return parsedList.map(p => new Pet(p.pet_id, p.owner_id, p.name, p.category, p.pet_bio, p.pet_img));
    } catch (err) {
        console.warn("Failed to load pets:", err);
        return [];
    }
}

async function savePets(pets) {
    try {
        const res = await fetch('/api/save-pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pets)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.error("Could not sync to pets.JSON:", err);
    }
}

async function getPetsByOwnerId(ownerId) {
    const allPets = await loadPets();
    return allPets.filter(pet => pet.getOwnerId().toString() === ownerId.toString());
}

// ============================================= Forum =============================================
async function loadForumPosts() {
    try {
        const res = await fetch('data/forum.JSON?t=' + Date.now());
        const raw = await res.json();
        return raw.map(postData => {
            const comments = (postData.comments || []).map(c =>
                new Comment(c.id, c.userId, c.content, new Date(c.createdAt))
            );
            return new ForumPost(
                postData.id, postData.userId, postData.category,
                postData.title, postData.content,
                new Date(postData.datePosted), comments, postData.status
            );
        });
    } catch (err) {
        console.warn("Failed to load forum posts:", err);
        return [];
    }
}

async function saveForumPosts(posts) {
    const plainPosts = posts.map(post => {
        const data = post.viewPost();
        return { ...data, comments: data.comments.map(c => c.viewComment()) };
    });
    try {
        const res = await fetch('/api/save-forum-posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plainPosts)
        });
        const result = await res.json();
        console.log(result.message);
    } catch (err) {
        console.error("Forum save failed:", err);
    }
}

async function getForumPostById(postId) {
    const posts = await loadForumPosts();
    return posts.find(p => p.getId() === postId);
}

// ============================================= Quiz =============================================
async function loadQuizzes() {
    try {
        const res = await fetch('data/sampleQuizzes.json?t=' + Date.now());
        const parsed = await res.json();
        return parsed.map(quizData => {
            const questions = (quizData.questions || []).map(question =>
                new QuizQuestion(question.id, question.questionText, question.options, question.correctAnswer)
            );
            return new Quiz(quizData.id, quizData.title, quizData.category, questions, quizData.score || 0);
        });
    } catch (err) {
        console.warn("Failed to load quizzes:", err);
        return [];
    }
}

async function saveQuizzes(quizzes) {
    const plainData = quizzes.map(quiz => ({
        id: quiz.getId(),
        title: quiz.getTitle(),
        category: quiz.getCategory(),
        score: quiz.getScore().score,
        questions: quiz.getQuestions().map(q => ({
            id: q.id, questionText: q.questionText,
            options: q.options, correctAnswer: q.correctAnswer
        }))
    }));
    try {
        const res = await fetch('/api/save-quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plainData)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.error("Could not sync quizzes:", err);
    }
}

async function getAllQuizzes() {
    return await loadQuizzes();
}

async function getQuizzesByCategory(category) {
    const quizzes = await loadQuizzes();
    return quizzes.filter(quiz => quiz.getCategory() === category);
}

async function getQuizById(quizId) {
    const quizzes = await loadQuizzes();
    return quizzes.find(quiz => quiz.getId() === quizId) || null;
}

// ============================================= Feedback =============================================
async function saveFeedback(feedback) {
    try {
        const res = await fetch('/api/save-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedback)
        });
        const result = await res.json();
        console.log("Disk Sync:", result.message);
    } catch (err) {
        console.warn('Feedback server sync failed:', err);
    }
}

async function loadFeedback() {
    try {
        const res = await fetch('data/feedback.JSON?t=' + Date.now());
        const arr = await res.json();
        if (Array.isArray(arr)) return arr;
    } catch (e) {
        console.warn('Server feedback fetch failed:', e);
    }
    return [];
}

// ============================================= Session (stays on localStorage) =====================
function saveSession(user) {
    localStorage.setItem('petaid_active_session', JSON.stringify(user.toJSON()));
}
function clearSession() {
    localStorage.removeItem('petaid_active_session');
}
function updateSession(user) {
    localStorage.setItem('petaid_active_session', JSON.stringify(user.toJSON()));
}
