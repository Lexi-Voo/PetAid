// ===== State =====
let currentQuiz = null;
let currentQuizId = null;
let admin = null;

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", function () {
    renderNavbar("Quizzes");
    renderFooter();
    checkAdminStatus();
    setupAdminToggle();
    loadQuiz();
});

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

function toggleAdmin() {
    const isAdmin = document.body.classList.toggle("is-admin");
    if (isAdmin) {
        sessionStorage.setItem("petaid_role", "admin");
        admin = new Admin(null, "admin@petaid.com", "admin");
        showConfirmation("Admin mode enabled");
    } else {
        sessionStorage.removeItem("petaid_role");
        admin = null;
        showConfirmation("Admin mode disabled");
    }
    renderQuiz();
}

function setupAdminToggle() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            document.body.classList.remove("is-admin");
            sessionStorage.removeItem("petaid_role");
            admin = null;
            showConfirmation("Logged out");
            renderQuiz();
        });
    }
}

function loadQuiz() {
    const params = new URLSearchParams(window.location.search);

    currentQuizId = params.get("id");

    if (!currentQuizId) {
        document.getElementById("quizTitle").textContent =
            "Quiz not found";
        return;
    }

    currentQuiz = getQuizById(currentQuizId);

    if (!currentQuiz) {
        document.getElementById("quizTitle").textContent =
            "Quiz not found";
        return;
    }

    renderQuiz();
}

function renderQuiz() {
    if (!currentQuiz) return;

    const data = currentQuiz.viewQuiz();

    document.title = data.title + " - PetAid";
    document.getElementById("quizTitle").textContent = data.title;

    // Shuffle the questions array before rendering
    const shuffledQuestions = [...data.questions].sort(() => Math.random() - 0.5);

    renderQuestions(shuffledQuestions);
}

function renderQuestions(questions) {
    const container = document.getElementById("questionsList");

    if (questions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px;">
                No questions added yet.
            </div>
        `;
        return;
    }

    container.innerHTML = questions.map((question, index) => `
        <div class="question-card">

            <div class="question-header">
                <h3>
                    Question ${index + 1}
                </h3>

                <div class="admin-only">
                    <button class="btn-icon"
                            onclick="openEditQuestionModal('${question.id}')">
                    </button>

                    <button class="btn-icon danger"
                            onclick="openDeleteQuestionModal('${question.id}')">
                    </button>
                </div>
            </div>

            <p class="question-text">
                ${question.questionText}
            </p>

            <div class="question-options">
                ${question.options.map(option => `
                    <label class="quiz-option">
                        <input type="radio"
                               name="${question.id}"
                               value="${option}">
                        ${option}
                    </label>
                `).join("")}
            </div>

        </div>
    `).join("");
}

function submitQuiz() {
    const data = currentQuiz.viewQuiz();

    let answers = {};

    data.questions.forEach(question => {

        const selected = document.querySelector(
            `input[name="${question.id}"]:checked`
        );

        if (selected) {
            answers[question.id] = selected.value;
        }
    });

    const result = currentQuiz.submitQuiz(answers);

    showConfirmation(
        `You scored ${result.score}/${result.total}`
    );
}

// ===== Edit Quiz Modal =====
function openEditQuizModal() {
    const data = currentQuiz.viewQuiz();

    document.getElementById("editQuizTitle").value =
        data.title;

    document.getElementById("editQuizCategory").value =
        data.category;

    document.getElementById("editQuizModal")
        .classList.add("active");
}

function closeEditQuizModal() {
    document.getElementById("editQuizModal")
        .classList.remove("active");
}

function saveEditQuiz() {
    const title =
        document.getElementById("editQuizTitle")
        .value.trim();

    const category =
        document.getElementById("editQuizCategory")
        .value;

    if (!title) {
        showConfirmation(
            "Please enter a quiz title",
            true
        );
        return;
    }

    admin.manageQuiz("edit", {
        id: currentQuizId,
        title: title,
        category: category
    });

    currentQuiz = getQuizById(currentQuizId);

    closeEditQuizModal();

    renderQuiz();

    showConfirmation(
        "Quiz updated successfully"
    );
}

// ===== Delete Quiz =====
function openDeleteQuizModal() {
    showDeleteConfirm(
        "Delete Quiz",

        "Are you sure you want to delete this quiz?",

        function () {

            admin.manageQuiz("delete", {
                id: currentQuizId
            });

            showConfirmation(
                "Quiz deleted successfully"
            );

            setTimeout(() => {

                window.location.href =
                    "quiz.html";

            }, 1000);
        }
    );
}

// ===== Add Question Modal =====
function openAddQuestionModal() {
    document.getElementById("questionModalTitle").textContent = "Add Question";

    document.getElementById("questionModalSave").textContent = "Add";

    document.getElementById("questionText").value = "";

    document.getElementById("option1").value = "";

    document.getElementById("option2").value = "";

    document.getElementById("option3").value = "";

    document.getElementById("option4").value = "";

    document.getElementById("correctAnswer").value = "0";

    document.getElementById("editingQuestionId").value = "";

    document.getElementById("questionModal")
        .classList.add("active");
}

// ===== Edit Question Modal =====
function openEditQuestionModal(questionId) {
    const question = currentQuiz
        .getQuestions()
        .find(q => q.id === questionId);

    if (!question) return;

    document.getElementById("questionModalTitle").textContent = "Edit Question";

    document.getElementById("questionModalSave").textContent = "Save";

    document.getElementById("questionText").value = question.questionText;

    document.getElementById("option1").value = question.options[0] || "";

    document.getElementById("option2").value = question.options[1] || "";

    document.getElementById("option3").value = question.options[2] || "";

    document.getElementById("option4").value = question.options[3] || "";

    const correctIndex = question.options.indexOf(question.correctAnswer);

    document.getElementById("correctAnswer").value = correctIndex >= 0 ? correctIndex : 0;

    document.getElementById("editingQuestionId").value = question.id;

    document.getElementById("questionModal").classList.add("active");
}

// ===== Save Question =====
function closeQuestionModal() {
    document.getElementById("questionModal").classList.remove("active");
    document.getElementById("editingQuestionId").value = "";
}

function saveQuestion() {
    const questionText = document.getElementById("questionText").value.trim();

    const options = [
        document.getElementById("option1").value.trim(),
        document.getElementById("option2").value.trim(),
        document.getElementById("option3").value.trim(),
        document.getElementById("option4").value.trim()
    ];

    const correctIndex = parseInt(document.getElementById("correctAnswer").value);
    const filteredOptions = options.filter(o => o !== "");
    const correctAnswer = filteredOptions[correctIndex];
    const editingQuestionId = document.getElementById("editingQuestionId").value;

    if (
        !questionText ||
        filteredOptions.length < 2 ||
        !correctAnswer
    ) {

        showConfirmation(
            "Please complete all fields",
            true
        );

        return;
    }

    if (editingQuestionId) {

        admin.manageQuestion(
            "edit",
            currentQuizId,
            {
                id: editingQuestionId,
                questionText: questionText,
                options: filteredOptions,
                correctAnswer: correctAnswer
            }
        );

        showConfirmation(
            "Question updated successfully"
        );

    } else {

        admin.manageQuestion(
            "add",
            currentQuizId,
            {
                id: "q_" + Date.now(),
                questionText: questionText,
                options: filteredOptions,
                correctAnswer: correctAnswer
            }
        );

        showConfirmation(
            "Question added successfully"
        );
    }

    currentQuiz = getQuizById(currentQuizId);

    closeQuestionModal();

    renderQuiz();
}

// ===== Delete Question =====
function openDeleteQuestionModal(questionId) {
    showDeleteConfirm(
        "Delete Question",

        "Are you sure you want to delete this question?",

        function () {
            admin.manageQuestion(
                "remove",
                currentQuizId,
                {
                    id: questionId
                }
            );

            currentQuiz = getQuizById(currentQuizId);

            renderQuiz();

            showConfirmation("Question deleted successfully");
        }
    );
}