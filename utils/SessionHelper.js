function getCurrentUser() {
    const sessionData = localStorage.getItem('petaid_active_session');
    if (!sessionData) return null;
    
    try {
        const rawObj = JSON.parse(sessionData);
        const profileInstance = new UserProfile(
            rawObj.name, 
            rawObj.biography || "", 
            rawObj.profile_pic || "assets/profiles/profile.jpg"
        );

        if (rawObj.role === 'admin') {
            return new Admin(rawObj.user_id, profileInstance, rawObj.username, rawObj.password, rawObj.email);
        } else if (rawObj.role === 'veterinarian') {
            const vetInstance = new Veterinarian(rawObj.user_id, profileInstance, rawObj.username, rawObj.password, rawObj.email, rawObj.phone || "");
            if (rawObj.cert_path) vetInstance.cert_path = rawObj.cert_path;
            return vetInstance;
        } else {
            return new PetOwner(rawObj.user_id, profileInstance, rawObj.username, rawObj.password, rawObj.email);
        }
    } catch (err) {
        console.error("Session instantiation hydration failure:", err);
        return null;
    }
}

// Clear session data and log out
function logoutUser() {
    localStorage.removeItem('petaid_active_session');
    window.location.href = 'firstAid.html'; 
}

function updateNavbarAuth() {
    const authContainer = document.querySelector('.navbar-auth');
    if (!authContainer) return; 

    const userInstance = getCurrentUser(); 
    if (userInstance) {
        const role = userInstance.getRole();
        const profile = userInstance.getProfile();
        if (role === 'admin') {
            authContainer.innerHTML = `
                <span style="margin-right: 15px; font-weight: bold; color: #2c3e50;">Admin Mode 🛡️</span>
                <button class="btn btn-outline btn-sm" id="navLogoutBtn" style="padding: 5px 10px; background:#e74c3c; color:white; border:none; border-radius:4px; cursor:pointer;">Logout</button>`;
        } else {
            const displayName = profile.getName() || userInstance.getUsername();
            const roleLabel = role === 'veterinarian' ? "Vet" : "Owner";
            authContainer.innerHTML = `
                <span style="margin-right: 15px; color: #555;">Welcome, <strong>${displayName}</strong> (${roleLabel})</span>
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