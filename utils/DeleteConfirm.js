// DeleteConfirm.js — Reusable delete confirmation modal
// Usage: showDeleteConfirm("Title", "Message", function() { /* on confirm */ });
//        closeDeleteConfirm() to close manually

(function () {
    // Create the modal HTML automatically
    const overlay = document.createElement("div");
    overlay.id = "deleteConfirmOverlay";
    overlay.className = "delete-confirm-overlay";
    overlay.innerHTML = `
        <div class="delete-confirm-modal">
            <h3 class="delete-confirm-title" id="deleteConfirmTitle"></h3>
            <p class="delete-confirm-message" id="deleteConfirmMessage"></p>
            <div class="delete-confirm-actions">
                <button class="btn btn-outline" onclick="closeDeleteConfirm()">Cancel</button>
                <button class="btn btn-danger" id="deleteConfirmBtn">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Create the CSS if not already loaded
    if (!document.querySelector("#delete-confirm-styles")) {
        const style = document.createElement("style");
        style.id = "delete-confirm-styles";
        style.textContent = `
            .delete-confirm-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.4);
                z-index: 200;
                align-items: center;
                justify-content: center;
            }

            .delete-confirm-overlay.active {
                display: flex;
            }

            .delete-confirm-modal {
                background-color: #FFFFFF;
                border-radius: 14px;
                padding: 32px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }

            .delete-confirm-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: #1A1A1A;
                margin-bottom: 12px;
            }

            .delete-confirm-message {
                font-size: 0.95rem;
                color: #5A5A5A;
                margin-bottom: 24px;
                line-height: 1.5;
            }

            .delete-confirm-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }
})();

function showDeleteConfirm(title, message, onConfirm) {
    document.getElementById("deleteConfirmTitle").textContent = title;
    document.getElementById("deleteConfirmMessage").textContent = message;
    document.getElementById("deleteConfirmOverlay").classList.add("active");

    document.getElementById("deleteConfirmBtn").onclick = function () {
        closeDeleteConfirm();
        onConfirm();
    };
}

function closeDeleteConfirm() {
    document.getElementById("deleteConfirmOverlay").classList.remove("active");
}