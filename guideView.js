// ===== State =====
let currentGuide = null;
let currentGuideId = null;
let admin = null;

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", async function () {
    renderNavbar("First Aid");
    renderFooter();
    checkAdminStatus();
    loadGuide();
});

function checkAdminStatus() {
    const activeUser = getCurrentUser();
    if (activeUser && activeUser.getRole() === "admin") {
        document.body.classList.add("is-admin");
        admin = activeUser;
    }
}

// ===== Load Guide from URL params =====
async function loadGuide() {
    const params = new URLSearchParams(window.location.search);
    currentGuideId = params.get("id");

    if (!currentGuideId) {
        document.getElementById("guideTitle").textContent = "Guide not found";
        return;
    }

    currentGuide = await getGuideById(currentGuideId);

    if (!currentGuide) {
        document.getElementById("guideTitle").textContent = "Guide not found";
        return;
    }

    renderGuide();
}

// ===== Render Full Guide =====
function renderGuide() {
    if (!currentGuide) return;

    const data = currentGuide.viewGuide();

    // Update page title
    document.title = data.title + " - PetAid";

    // Header
    document.getElementById("guideTitle").textContent = data.title;
    document.getElementById("guideCategory").textContent = data.category + " · First Aid Guide";

    // Render steps
    renderSteps(data.steps);

    // Render videos
    renderVideos(data.videos);
}

// ===== Render Steps =====
function renderSteps(steps) {
    const container = document.getElementById("stepsList");

    if (steps.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                No steps added yet.
            </div>
        `;
        return;
    }

    container.innerHTML = steps.map(step => `
        <div class="step-card">
            <div class="step-number">${step.stepNumber}</div>
            <div class="step-content">
                <p class="step-instruction">${step.instruction}</p>
                ${step.imageURL ? `<img src="${step.imageURL}" alt="Step ${step.stepNumber}" class="step-image">` : ""}
            </div>
            <div class="step-actions admin-only">
                <button class="btn-icon" onclick="openEditStepModal(${step.stepNumber})" title="Edit step">
                    ✏️
                </button>
                <button class="btn-icon danger" onclick="openDeleteStepModal(${step.stepNumber})" title="Delete step">
                    🗑️
                </button>
            </div>
        </div>
    `).join("");
}

// ===== Convert YouTube URL to Embed URL =====
function getYouTubeEmbedURL(url) {
    // Handles:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID (already embed)
    let videoId = null;

    if (url.includes("youtube.com/watch")) {
        const params = new URLSearchParams(new URL(url).search);
        videoId = params.get("v");
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
        return url; // Already an embed URL
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // Not a YouTube URL — return null
    return null;
}

// ===== Render Videos =====
function renderVideos(videos) {
    const container = document.getElementById("videosList");

    if (videos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                No videos added yet.
            </div>
        `;
        return;
    }

    container.innerHTML = videos.map(video => {
        const embedURL = getYouTubeEmbedURL(video.url);

        return `
            <div class="video-card-embed">
                <div class="video-card-header">
                    <span class="video-title">${video.title}</span>
                    <div class="video-actions">
                        <button class="btn-icon danger admin-only" onclick="openDeleteVideoModal('${video.title}')" title="Delete video">
                            🗑️
                        </button>
                    </div>
                </div>
                ${embedURL
                    ? `<div class="video-embed-wrapper">
                           <iframe src="${embedURL}" 
                                   title="${video.title}" 
                                   frameborder="0" 
                                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                   allowfullscreen>
                           </iframe>
                       </div>`
                    : `<div class="video-fallback">
                           <p>Cannot embed this video.</p>
                           <a href="${video.url}" target="_blank" class="btn btn-outline btn-sm">Open in new tab</a>
                       </div>`
                }
            </div>
        `;
    }).join("");
}

// ===== Edit Guide Modal =====
function openEditGuideModal() {
    const data = currentGuide.viewGuide();
    document.getElementById("editGuideTitle").value = data.title;
    document.getElementById("editGuideCategory").value = data.category;
    document.getElementById("editGuideModal").classList.add("active");
}

function closeEditGuideModal() {
    document.getElementById("editGuideModal").classList.remove("active");
}

async function saveEditGuide() {
    const title = document.getElementById("editGuideTitle").value.trim();
    const category = document.getElementById("editGuideCategory").value;

    if (!title) {
        showConfirmation("Please enter a guide title", true);
        return;
    }

    await admin.manageGuide("edit", {
        id: currentGuideId,
        title: title,
        category: category
    });

    // Reload the guide from storage to get updated data
    currentGuide = await getGuideById(currentGuideId);
    closeEditGuideModal();
    renderGuide();
    showConfirmation("Guide updated successfully");
}

// ===== Delete Guide =====
function openDeleteGuideModal() {
    showDeleteConfirm(
        "Delete Guide",
        "Are you sure you want to delete this entire guide? All steps and videos will be removed. This cannot be undone.",
        async function () {
            await admin.manageGuide("delete", { id: currentGuideId });
            showConfirmation("Guide deleted successfully");
            setTimeout(() => {
                window.location.href = "firstAid.html";
            }, 1000);
        }
    );
}

// ===== Add Step Modal =====
function openAddStepModal() {
    document.getElementById("stepModalTitle").textContent = "Add Step";
    document.getElementById("stepModalSave").textContent = "Add";
    document.getElementById("stepInstruction").value = "";
    document.getElementById("stepImageURL").value = "";
    document.getElementById("stepImageFile").value = "";
    document.getElementById("stepImagePreview").style.display = "none";
    document.getElementById("editingStepNumber").value = "";
    document.getElementById("stepModal").classList.add("active");
}

// ===== Edit Step Modal =====
function openEditStepModal(stepNumber) {
    const data = currentGuide.viewGuide();
    const step = data.steps.find(s => s.stepNumber === stepNumber);
    if (!step) return;

    document.getElementById("stepModalTitle").textContent = "Edit Step " + stepNumber;
    document.getElementById("stepModalSave").textContent = "Save";
    document.getElementById("stepInstruction").value = step.instruction;
    document.getElementById("stepImageURL").value = step.imageURL || "";
    document.getElementById("stepImageFile").value = "";
    if (step.imageURL) {
        document.getElementById("stepImagePreview").src = step.imageURL;
        document.getElementById("stepImagePreview").style.display = "block";
    } else {
        document.getElementById("stepImagePreview").style.display = "none";
    }
    document.getElementById("editingStepNumber").value = stepNumber;
    document.getElementById("stepModal").classList.add("active");
}

function closeStepModal() {
    document.getElementById("stepModal").classList.remove("active");
}

async function saveStep() {
    const instruction = document.getElementById("stepInstruction").value.trim();
    const editingStep = document.getElementById("editingStepNumber").value;
    const fileInput = document.getElementById("stepImageFile");
    let imageURL = document.getElementById("stepImageURL").value; // keeps existing URL when editing

    if (!instruction) {
        showConfirmation("Please enter step instruction", true);
        return;
    }

    // Upload image if a new file was selected
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('id', currentGuideId + '_step' + (editingStep || (currentGuide.viewGuide().steps.length + 1)));
        formData.append('uploadType', 'guide');
        formData.append('image', fileInput.files[0]);

        try {
            const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                imageURL = result.savedPath;
            } else {
                showConfirmation("Image upload failed: " + result.message, true);
                return;
            }
        } catch (err) {
            console.error("Image upload error:", err);
            showConfirmation("Image upload failed", true);
            return;
        }
    }

    if (editingStep) {
        await admin.manageStep("edit", currentGuideId, {
            stepNumber: parseInt(editingStep),
            instruction: instruction,
            imageURL: imageURL
        });
        showConfirmation("Step updated successfully");
    } else {
        const data = currentGuide.viewGuide();
        const nextNumber = data.steps.length + 1;
        await admin.manageStep("add", currentGuideId, {
            stepNumber: nextNumber,
            instruction: instruction,
            imageURL: imageURL
        });
        showConfirmation("Step added successfully");
    }

    currentGuide = await getGuideById(currentGuideId);
    closeStepModal();
    renderGuide();
}

// ===== Delete Step =====
function openDeleteStepModal(stepNumber) {
    showDeleteConfirm(
        "Delete Step",
        "Are you sure you want to delete Step " + stepNumber + "? Remaining steps will be renumbered.",
        async function () {
            await admin.manageStep("remove", currentGuideId, { stepNumber: stepNumber });
            currentGuide = await getGuideById(currentGuideId);
            renderGuide();
            showConfirmation("Step deleted successfully");
        }
    );
}

// ===== Add Video Modal =====
function openAddVideoModal() {
    document.getElementById("videoModalTitle").textContent = "Add Video";
    document.getElementById("videoModalSave").textContent = "Add";
    document.getElementById("videoTitle").value = "";
    document.getElementById("videoURL").value = "";
    document.getElementById("editingVideoTitle").value = "";
    document.getElementById("videoModal").classList.add("active");
}

function closeVideoModal() {
    document.getElementById("videoModal").classList.remove("active");
}

async function saveVideo() {
    const title = document.getElementById("videoTitle").value.trim();
    const url = document.getElementById("videoURL").value.trim();
    const editingTitle = document.getElementById("editingVideoTitle").value;

    if (!title || !url) {
        showConfirmation("Please fill in all video fields", true);
        return;
    }

    if (editingTitle) {
        await admin.manageVideo("edit", currentGuideId, {
            oldTitle: editingTitle,
            title: title,
            url: url
        });
        showConfirmation("Video updated successfully");
    } else {
        await admin.manageVideo("add", currentGuideId, {
            title: title,
            url: url
        });
        showConfirmation("Video added successfully");
    }

    currentGuide = await getGuideById(currentGuideId);
    closeVideoModal();
    renderGuide();
}

// ===== Delete Video =====
function openDeleteVideoModal(videoTitle) {
    showDeleteConfirm(
        "Delete Video",
        'Are you sure you want to delete the video "' + videoTitle + '"?',
        async function () {
            await admin.manageVideo("remove", currentGuideId, { title: videoTitle });
            currentGuide = await getGuideById(currentGuideId);
            renderGuide();
            showConfirmation("Video deleted successfully");
        }
    );
}