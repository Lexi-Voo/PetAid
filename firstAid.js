// ===== State =====
let selectedCategory = null;
let admin = null;
let guideToDelete = null;
let editingGuideId = null;

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", function () {
    renderNavbar("First Aid");
    renderFooter();
    //loadSampleDataIfNeeded();
    checkAdminStatus();
});



// Check if admin is logged in (using the actual login session)
function checkAdminStatus() {
    const activeUser = getCurrentUser();
    if (activeUser && activeUser.getRole() === "admin") {
        document.body.classList.add("is-admin");
        admin = activeUser;
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

// Navbar admin link injection removed — handled by renderNavbar() in Navbar.js