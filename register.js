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
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('fullName').value.trim();
        const role = roleSelect.value;
        const email = document.getElementById('email').value.trim(); 
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (role === 'veterinarian') {
            if (!certInput || certInput.files.length === 0) {
                showConfirmation("Error: Veterinarians must upload a valid professional certificate.", true);
                if (certInput) certInput.focus();
                return;
            }
        }
        const savedUsers = loadAuthUsers();
        const savedApprovals = loadApprovals();
        const usernameExists = savedUsers.some(u => u.username && u.username.toLowerCase() === username.toLowerCase()) ||
                               savedApprovals.some(a => a.username && a.username.toLowerCase() === username.toLowerCase());
        if (usernameExists) {
            showConfirmation("Error: Username is already taken.", true);
            return;
        }

        if (role === 'petowner') {
            let maxUserId = 0;
            savedUsers.forEach(u => {
                const idNum = parseInt(u.user_id);
                if (!isNaN(idNum) && idNum > maxUserId) { maxUserId = idNum; }
            });
            const newUserId = (maxUserId + 1).toString(); 
            const newUser = {
                "user_id": newUserId,
                "username": username,
                "password": password,
                "name": name,
                "email": email,
                "role": "petowner",
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
            setTimeout(() => { window.location.href = "firstAid.html"; }, 1500);
        } else if (role === 'veterinarian') {
            let maxReqId = 0;
            savedApprovals.forEach(a => {
                const idNum = parseInt(a.req_id);
                if (!isNaN(idNum) && idNum > maxReqId) { maxReqId = idNum; }
            });
            const newReqId = (maxReqId + 1).toString(); 
            let assignedCertPath = "assets/certs/cert.jpg"; 
            const selectedCertFile = certInput.files[0];
            if (selectedCertFile) {
                const formData = new FormData();
                formData.append('id', newReqId);
                formData.append('uploadType', 'cert'); 
                formData.append('image', selectedCertFile);
                try {
                    const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (result.success) {
                        assignedCertPath = result.savedPath;
                    }
                } catch (err) {
                    console.error("Certificate disk syncing failure:", err);
                }
            }
            const newApprovalRequest = {
                "req_id": newReqId,
                "username": username,
                "password": password,
                "name": name,
                "email": email,
                "cert_path": assignedCertPath, 
                "applied_at": new Date().toISOString().split('T')[0] 
            };
            savedApprovals.push(newApprovalRequest);
            saveApprovals(savedApprovals);
            showConfirmation("Registration submitted! Please wait for Admin approval.");  
            setTimeout(() => { window.location.href = "firstAid.html"; }, 1500);       
            registerForm.reset();
            certGroup.classList.add('hidden');
        }
    });
});