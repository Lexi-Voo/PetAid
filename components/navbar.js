function renderNavbar(activePage = "") {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const role = user ? user.getRole() : "";

    let navLinks = [];

    const userLinks = [
        { href: "index.html",     label: "Home" },
        { href: "map.html",     label: "Clinics" },
        { href: "firstAid.html",  label: "First Aid" },
        { href: "forum.html",     label: "Forum" },
        { href: "quiz.html",      label: "Quizzes" },
    ];

    const adminLinks = [
        { href: "index.html",     label: "Home" },
        { href: "map.html",     label: "Clinics" },
        { href: "firstAid.html",  label: "First Aid" },
        { href: "forum.html",     label: "Forum" },
        { href: "quiz.html",      label: "Quizzes" },
        { href: "admin.html",  label: "Approve" },
        { href: "feedback-view.html",     label: "Feedback" },
    ];

    const userNavLinks = userLinks.map(link => `
        <li>
            <a href="${link.href}" ${activePage === link.label ? 'class="active"' : ""}>
                ${link.label}
            </a>
        </li>
    `).join("");

    const adminNavLinks = adminLinks.map(link => `
        <li>
            <a href="${link.href}" ${activePage === link.label ? 'class="active"' : ""}>
                ${link.label}
            </a>
        </li>
    `).join("");

    // Auth buttons — change based on role
    let authHTML = "";
    if (role === "") {
        navLinks = userNavLinks;
        authHTML = `
            <button class="btn btn-login" onclick="window.location.href='login.html'">Login</button>
            <button class="btn btn-primary" onclick="window.location.href='register.html'">Register</button>
        `;
    } else if (role === "petowner" || role === "veterinarian") {
        navLinks = userNavLinks;
        const usernameDisplay = user.getProfile().getName() || user.getUsername();
        authHTML = `
            <span class="navbar-username">${usernameDisplay}</span>
            <button class="btn btn-primary" onclick="window.location.href='profile.html'">Profile</button>
            <button class="btn btn-outline" id="navLogoutBtn">Logout</button>
        `;
    } else if (role === "admin") {
        navLinks = adminNavLinks;
        authHTML = `
            <span class="navbar-username navbar-admin-badge" style="margin-right: 10px; font-weight: bold; color: #2c3e50;">Admin Mode 🛡️</span>
            <button class="btn btn-outline" id="navLogoutBtn">Logout</button>
        `;
    }

    const navbarTargetContainer = document.getElementById("navbar-container");
    if (navbarTargetContainer) {
        navbarTargetContainer.innerHTML = `
            <nav class="navbar">
                <a href="index.html" class="navbar-brand">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width:24px; height:24px; vertical-align:middle; margin-right:5px;">
                        <path d="M4.5 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm15 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm-12.5 3a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm10 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM12 21c-3.5 0-6-2.5-6-6 0-3 2.5-5.5 6-5.5s6 2.5 6 5.5c0 3.5-2.5 6-6 6z"/>
                    </svg>
                    PetAid
                </a>
                <ul class="navbar-links">${navLinks}</ul>
                <div class="navbar-auth">${authHTML}</div>
            </nav>
        `;

        const navLogoutBtn = document.getElementById('navLogoutBtn');
        if (navLogoutBtn && user) {
            navLogoutBtn.addEventListener('click', () => {
                user.logout(); 
                window.location.href = 'firstAid.html';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let currentPageLabel = "";
    if (document.title.includes("First Aid")) currentPageLabel = "First Aid";
    if (document.title.includes("Clinics")) currentPageLabel = "Clinics";
    if (document.title.includes("Forum")) currentPageLabel = "Forum";
    if (document.title.includes("Quizzes")) currentPageLabel = "Quizzes";
    if (document.title.includes("Home")) currentPageLabel = "Home";

    renderNavbar(currentPageLabel);
});