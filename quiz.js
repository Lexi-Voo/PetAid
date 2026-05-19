// ===== State =====
let selectedCategory = null;
let admin = null;
let user = new User(null, "guest@petaid.com", null, "petowner");

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", function () {
    renderNavbar("Quizzes");
    renderFooter();
    loadSampleDataIfNeeded();
    checkAdminStatus();
});

// ===== Load Sample Quiz Data =====
function loadSampleDataIfNeeded() {
    const existing = localStorage.getItem(QUIZ_STORAGE_KEY);

    if (!existing) {
        fetch("data/sampleQuizzes.json")
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data));
            })
            .catch(() => {
                console.log("Could not fetch sample quiz data.");
            });
    }
}

// ===== Check Admin Status =====
function checkAdminStatus() {
    const activeUser = getCurrentUser();

    if (activeUser && activeUser.role === "admin") {
        document.body.classList.add("is-admin");

        admin = new Admin(
            activeUser.id,
            activeUser.email,
            activeUser.password
        );
    } else {
        document.body.classList.remove("is-admin");
        admin = null;
    }
}

// ===== Select Category =====
function selectCategory(category) {
    selectedCategory = category;

    document.querySelectorAll(".category-card").forEach(card => {
        card.classList.remove("selected");
    });

    document
        .querySelector(`[data-category="${category}"]`)
        .classList.add("selected");

    renderQuizList(category);
}

// ===== Render Quiz List =====
function renderQuizList(category) {
    const section = document.getElementById("quizListSection");
    const title = document.getElementById("quizListTitle");
    const list = document.getElementById("quizList");

    const quizzes = getQuizzesByCategory(category);

    title.textContent = `${category} Quizzes`;
    section.classList.add("visible");

    if (quizzes.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-secondary);">
                No quizzes available for this category yet.
            </div>
        `;
        return;
    }

    list.innerHTML = quizzes.map(quiz => {
        const data = quiz.viewQuiz();

        return `
            <div class="guide-item" onclick="openQuiz('${data.id}')">
                <div class="guide-item-info">
                    <div>
                        <div class="guide-item-title">
                            ${data.title}
                        </div>

                        <div class="guide-item-meta">
                            ${data.questions.length} question${data.questions.length !== 1 ? "s" : ""}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ===== Open Quiz =====
function openQuiz(quizId) {
    window.location.href = `quizView.html?id=${quizId}`;
}

// ===== Modal =====
function openCreateQuizModal() {
    document.getElementById("quizModalTitle").textContent = "Create New Quiz";
    document.getElementById("quizModalSave").textContent = "Create";

    document.getElementById("quizTitle").value = "";
    document.getElementById("quizCategory").value =
        selectedCategory || "dog";

    document.getElementById("quizModal").classList.add("active");
}

function closeQuizModal() {
    document.getElementById("quizModal").classList.remove("active");
}

// ===== Save Quiz =====
function saveQuiz() {
    const title = document.getElementById("quizTitle").value.trim();
    const category = document.getElementById("quizCategory").value;

    if (!title) {
        showConfirmation("Please enter a quiz title", true);
        return;
    }

    admin.manageQuiz("create", {
        title,
        category
    });

    showConfirmation("Quiz created successfully");

    closeQuizModal();

    renderQuizList(selectedCategory);
}
