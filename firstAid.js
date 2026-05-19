// ===== State =====
let selectedCategory = null;
let admin = null;
let guideToDelete = null;
let editingGuideId = null;

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", function () {
    loadSampleDataIfNeeded();
    checkAdminStatus();
    setupAdminToggle();
});

// Load sample data into localStorage if it's empty (first visit)
function loadSampleDataIfNeeded() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
        fetch("data/sampleGuides.json")
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            })
            .catch(() => {
                // If fetch fails (file:// protocol), load inline sample
                console.log("Could not fetch sample data. Starting with empty guides.");
            });
    }
}

// Check if admin is logged in (using sessionStorage for session persistence)
function checkAdminStatus() {
    const isAdmin = sessionStorage.getItem("petaid_role") === "admin";
    if (isAdmin) {
        document.body.classList.add("is-admin");
        admin = new Admin(null, "admin@petaid.com", "admin");
    }
}

// Toggle admin mode via button (for testing)
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
    // Re-render guide list if a category is selected
    if (selectedCategory) {
        renderGuideList(selectedCategory);
    }
}

function setupAdminToggle() {
    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            document.body.classList.remove("is-admin");
            sessionStorage.removeItem("petaid_role");
            admin = null;
            showConfirmation("Logged out");
            if (selectedCategory) {
                renderGuideList(selectedCategory);
            }
        });
    }
}

// ===== Category Selection =====
function selectCategory(category) {
    selectedCategory = category;

    // Update selected card styling
    document.querySelectorAll(".category-card").forEach(card => {
        card.classList.remove("selected");
    });
    document.querySelector(`[data-category="${category}"]`).classList.add("selected");

    renderGuideList(category);
}

// ===== Render Guide List =====
function renderGuideList(category) {
    const section = document.getElementById("guideListSection");
    const title = document.getElementById("guideListTitle");
    const list = document.getElementById("guideList");

    const guides = getGuidesByCategory(category);

    title.textContent = category + " First Aid Guides";
    section.classList.add("visible");

    if (guides.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                No guides available for this category yet.
            </div>
        `;
        return;
    }

    list.innerHTML = guides.map(guide => {
        const data = guide.viewGuide();
        const stepCount = data.steps.length;
        const videoCount = data.videos.length;

        return `
            <div class="guide-item" onclick="openGuide('${data.id}')">
                <div class="guide-item-info">
                    <div>
                        <div class="guide-item-title">${data.title}</div>
                        <div class="guide-item-meta">
                            ${stepCount} step${stepCount !== 1 ? "s" : ""}
                            ${videoCount > 0 ? " · " + videoCount + " video" + (videoCount !== 1 ? "s" : "") : ""}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ===== Navigate to Guide Detail =====
function openGuide(guideId) {
    window.location.href = `guideView.html?id=${guideId}`;
}

// ===== Create Guide Modal =====
function openCreateGuideModal() {
    editingGuideId = null;
    document.getElementById("guideModalTitle").textContent = "Create New Guide";
    document.getElementById("guideModalSave").textContent = "Create";
    document.getElementById("guideTitle").value = "";
    document.getElementById("guideCategory").value = selectedCategory || "dog";
    document.getElementById("guideModal").classList.add("active");
}

function closeGuideModal() {
    document.getElementById("guideModal").classList.remove("active");
    editingGuideId = null;
}

// ===== Edit Guide from List =====
// Removed — edit/delete now handled on guideView page only

// ===== Save Guide (Create Only) =====
function saveGuide() {
    const title = document.getElementById("guideTitle").value.trim();
    const category = document.getElementById("guideCategory").value;

    if (!title) {
        showConfirmation("Please enter a guide title", true);
        return;
    }

    admin.manageGuide("create", {
        title: title,
        category: category
    });
    showConfirmation("Guide created successfully");

    closeGuideModal();
    renderGuideList(selectedCategory);
}

// ===== Confirmation Popup =====
