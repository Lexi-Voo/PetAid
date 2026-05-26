function renderFooter() {
    const footerTargetContainer = document.getElementById("footer-container");
    if (footerTargetContainer) {
        footerTargetContainer.innerHTML = `
            <footer class="footer">
                <div class="footer-top">
                    <div class="footer-logo">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4.5 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm15 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm-12.5 3a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm10 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM12 21c-3.5 0-6-2.5-6-6 0-3 2.5-5.5 6-5.5s6 2.5 6 5.5c0 3.5-2.5 6-6 6z"/>
                        </svg>
                    </div>
                    <span class="footer-org">Sarawak Veterinary Association</span>
                </div>
                <div class="footer-bottom">
                    <p class="footer-disclaimer">
                        &copy; 2026 Sarawak Veterinary Association. Disclaimer: Information provided is for 
                        informational purposes and does not replace professional medical advice.
                    </p>
                    <div class="footer-links">
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Medical Disclaimer</a>
                        <a href="#">Contact Us</a>
                        <a href="feedback.html">Feedback</a>
                    </div>
                </div>
            </footer>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderFooter();
});