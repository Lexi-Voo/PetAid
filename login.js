document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const sessionData = localStorage.getItem('petaid_active_session');
    if (sessionData) {
        window.location.href = "firstAid.html";
        return;
    }
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const inputUsername = document.getElementById('email').value.trim(); 
        const inputPassword = document.getElementById('password').value.trim();
        const savedUsers = loadAuthUsers(); 
        const savedApprovals = loadApprovals();
        const activeUserInstance = savedUsers.find(u => 
            (u.getUsername() && u.getUsername().toLowerCase() === inputUsername.toLowerCase()) ||
            (u.getEmail() && u.getEmail().toLowerCase() === inputUsername.toLowerCase())
        );
        if (activeUserInstance) {
            if (activeUserInstance.getPassword() === inputPassword) {
                showConfirmation('Login successful! Redirecting to home...');
                localStorage.setItem('petaid_active_session', JSON.stringify(activeUserInstance.toJSON()));
                setTimeout(() => { window.location.href = "firstAid.html"; }, 1200);
                return;
            } else {
                showConfirmation('Invalid username or password.', true);
                return;
            }
        }
        const pendingVet = savedApprovals.find(a => a.username && a.username.toLowerCase() === inputUsername.toLowerCase());
        if (pendingVet) {
            showConfirmation('Your veterinary registration is still pending administrator review.', true);
            return;
        }
        showConfirmation('Invalid username or password.', true);
    });
});