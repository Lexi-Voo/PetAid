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

        const inputEmail = document.getElementById('email').value.trim();
        const inputPassword = document.getElementById('password').value.trim();
        const savedUsers = loadAuthUsers();
        const savedApprovals = loadApprovals();
        const activeUser = savedUsers.find(u => u.email && u.email.toLowerCase() === inputEmail.toLowerCase());

        if (activeUser) {
            if (activeUser.password === inputPassword) {
                showConfirmation('Login successful! Redirecting to home...');
                localStorage.setItem('petaid_active_session', JSON.stringify(activeUser));
                setTimeout(() => {
                    window.location.href = "firstAid.html"; 
                }, 1200);
                return;
            } else {
                showConfirmation('Invalid email or password.', true);
                return;
            }
        }

        const pendingVet = savedApprovals.find(a => a.email && a.email.toLowerCase() === inputEmail.toLowerCase());
        if (pendingVet) {
            showConfirmation('Your veterinary registration is still pending administrator review.', true);
            return;
        }
        showConfirmation('Invalid email or password.', true);
    });
});