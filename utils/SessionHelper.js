// Retrieve the currently logged-in user object
function getCurrentUser() {
    const sessionData = localStorage.getItem('petaid_active_session');
    return sessionData ? JSON.parse(sessionData) : null;
}

// Clear session data and log out
function logoutUser() {
    localStorage.removeItem('petaid_active_session');
    window.location.href = 'firstAid.html'; 
}

// Automatically update the navbar auth buttons based on login status
function updateNavbarAuth() {
    const authContainer = document.querySelector('.navbar-auth');
    if (!authContainer) return; 

    const user = getCurrentUser();
    if (user) {
        if (user.role === 'admin') {
            authContainer.innerHTML = `
                <span style="margin-right: 15px; font-weight: bold; color: #2c3e50;">Admin Mode</span>
                <button class="btn btn-outline btn-sm" id="navLogoutBtn" style="padding: 5px 10px; background:#e74c3c; color:white; border:none; border-radius:4px; cursor:pointer;">Logout</button>`;
        } else {
            authContainer.innerHTML = `
                <span style="margin-right: 15px; color: #555;">Welcome, <strong>${user.name}</strong></span>
                <button class="btn btn-sm" id="navProfileBtn" style="padding: 5px 10px; margin-right: 5px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">My Profile</button>
                <button class="btn btn-sm" id="navLogoutBtn" style="padding: 5px 10px; background:#7f8c8d; color:white; border:none; border-radius:4px; cursor:pointer;">Logout</button>`;
            document.getElementById('navProfileBtn').addEventListener('click', () => {
                window.location.href = 'profile.html';
            });
        }
        document.getElementById('navLogoutBtn').addEventListener('click', logoutUser);
    } else {
        authContainer.innerHTML = `
            <button class="btn btn-login" id="loginBtn" onclick="window.location.href='login.html'">Login</button>
            <button class="btn btn-primary" id="registerBtn" onclick="window.location.href='register.html'">Register</button>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavbarAuth();
});