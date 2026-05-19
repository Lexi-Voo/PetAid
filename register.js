document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const certGroup = document.getElementById('certGroup'); 
    const certInput = document.getElementById('certificate'); 

    if (!registerForm) return;

    roleSelect.addEventListener('change', (e) => {
        if (e.target.value === 'veterinarian') {
            certGroup.classList.remove('hidden');
        } else {
            certGroup.classList.add('hidden');
        }
    });
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('fullName').value.trim();
        const role = roleSelect.value;
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (role === 'veterinarian') {
            if (!certInput || certInput.files.length === 0) {
                showConfirmation("Error: Veterinarians must upload a valid professional certificate.", true);
                if (certInput) certInput.focus();
                return;
            }
        }
        if (password !== confirmPassword) {
            showConfirmation("Error: Passwords do not match.", true);
            return;
        }
        const savedUsers = loadAuthUsers();
        const savedApprovals = loadApprovals();
        const usernameExists = savedUsers.some(u => u.username && u.username.toLowerCase() === username.toLowerCase()) ||
                               savedApprovals.some(a => a.username && a.username.toLowerCase() === username.toLowerCase());
        if (usernameExists) {
            showConfirmation("Error: Username is already taken.", true);
            return;
        }

        if (role === 'owner') {
            let maxUserId = 0;
            savedUsers.forEach(u => {
                const idNum = parseInt(u.user_id);
                if (!isNaN(idNum) && idNum > maxUserId) {
                    maxUserId = idNum;
                }
            });
            const newUserId = (maxUserId + 1).toString(); 
            const newUser = {
                "user_id": newUserId,
                "username": username,
                "password": password,
                "name": name,
                "role": "owner",
                "biography": "", 
                "profile_pic": "assets/profiles/profile.jpg" 
            };

            savedUsers.push(newUser);
            saveAuthUsers(savedUsers);

            const autoLoginSession = {
                "user_id": newUser.user_id,
                "username": newUser.username,
                "name": newUser.name,
                "role": newUser.role
            };
            localStorage.setItem('petaid_active_session', JSON.stringify(autoLoginSession));
            showConfirmation("Registration successful! Logging you in...");         
            setTimeout(() => {
                window.location.href = "firstAid.html"; 
            }, 1500);
        } else if (role === 'veterinarian') {
            let maxReqId = 0;
            savedApprovals.forEach(a => {
                const idNum = parseInt(a.req_id);
                if (!isNaN(idNum) && idNum > maxReqId) {
                    maxReqId = idNum;
                }
            });
            const newReqId = (maxReqId + 1).toString(); 
            const newApprovalRequest = {
                "req_id": newReqId,
                "username": username,
                "password": password,
                "name": name,
                "cert_path": "assets/certs/cert.jpg", 
                "applied_at": new Date().toISOString().split('T')[0] 
            };
            savedApprovals.push(newApprovalRequest);
            saveApprovals(savedApprovals);
            showConfirmation("Registration submitted! Please wait for Admin approval.");  
            setTimeout(() => {
                window.location.href = "firstAid.html";
            }, 1500);       
            registerForm.reset();
            certGroup.classList.add('hidden');
        }
    });
});