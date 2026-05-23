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
        const authResult = User.authenticate(inputUsername, inputPassword);

        if (authResult.success) {
            showConfirmation('Login successful! Redirecting to home...');
            authResult.user.login(); 
            setTimeout(() => { window.location.href = "firstAid.html"; }, 1200);
        } else {
            showConfirmation(authResult.message, true);
        }
    });
});