// Confirmation.js — Reusable confirmation popup component
// Usage: showConfirmation("Message here") for success
//        showConfirmation("Error message", true) for error

(function () {
    // Create the popup element automatically when the script loads
    const popup = document.createElement("div");
    popup.id = "confirmationPopup";
    popup.className = "confirmation-popup";
    document.body.appendChild(popup);

    // Create the CSS if it's not already loaded
    if (!document.querySelector("#confirmation-styles")) {
        const style = document.createElement("style");
        style.id = "confirmation-styles";
        style.textContent = `
            .confirmation-popup {
                display: none;
                position: fixed;
                top: 100px;
                right: 24px;
                padding: 14px 24px;
                background-color: #0073CF;
                color: #FFFFFF;
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: 500;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 300;
                animation: confirmSlideIn 0.3s ease;
            }

            .confirmation-popup.error {
                background-color: #D32F2F;
            }

            .confirmation-popup.active {
                display: block;
            }

            @keyframes confirmSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
})();

function showConfirmation(message, isError = false) {
    const popup = document.getElementById("confirmationPopup");
    popup.textContent = message;
    popup.className = "confirmation-popup active" + (isError ? " error" : "");

    setTimeout(() => {
        popup.classList.remove("active");
    }, 2500);
}