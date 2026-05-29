document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const certGroup = document.getElementById('certGroup'); 
    const certInput = document.getElementById('certificate'); 
    const phoneInputEl = document.getElementById('phone');

    if (!registerForm) return;
    roleSelect.addEventListener('change', (e) => {
        if (e.target.value === 'veterinarian') {
            certGroup.classList.remove('hidden');
            if (phoneInputEl) phoneInputEl.setAttribute('required', 'true');
        } else {
            certGroup.classList.add('hidden');
            if (phoneInputEl) {
                phoneInputEl.removeAttribute('required');
                phoneInputEl.value = "";
            }
        }
    });

    if (phoneInputEl) {
        phoneInputEl.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9+\-\s]/g, '');
        });
    }
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('fullName').value.trim();
        const role = roleSelect.value;
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        const emailInputEl = document.getElementById('email');
        const email = emailInputEl ? emailInputEl.value.trim() : "";
        
        if (role === 'veterinarian') {
            if (!certInput || certInput.files.length === 0) {
                showConfirmation("Error: Veterinarians must upload a valid professional certificate.", true);
                if (certInput) certInput.focus();
                return;
            }
        }
        const savedUsers = await loadAuthUsers(); 
        const savedApprovals = await loadApprovals();

        const usernameExists = savedUsers.some(u => u.getUsername().toLowerCase() === username.toLowerCase()) ||
                               savedApprovals.some(a => a.username && a.username.toLowerCase() === username.toLowerCase());
        if (usernameExists) {
            showConfirmation("Error: Username is already taken.", true);
            return;
        }
        const emailExists = savedUsers.some(u => u.getEmail() && u.getEmail().toLowerCase() === email.toLowerCase()) ||
                             savedApprovals.some(a => a.email && a.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            showConfirmation("Error: Email address is already registered.", true);
            return;
        }

        if (role === 'petowner') {
            let maxUserId = 0;
            savedUsers.forEach(u => {
                const idNum = parseInt(u.getId());
                if (!isNaN(idNum) && idNum > maxUserId) { maxUserId = idNum; }
            });
            const newUserId = (maxUserId + 1).toString(); 
            const starterProfile = new UserProfile(name, " ", "assets/profiles/profile.jpg");
            const newOwnerInstance = new PetOwner(newUserId, starterProfile, username, password, email);
            await newOwnerInstance.register();

            showConfirmation("Registration successful! Logging you in...");         
            setTimeout(() => { window.location.href = "index.html"; }, 1500);

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
            
            const phone = phoneInputEl ? phoneInputEl.value.trim() : "";
            const starterProfile = new UserProfile(name, "Approved Vet. Registered on 2026-05-21.", "assets/profiles/profile.jpg");
            const newVetInstance = new Veterinarian(newReqId, starterProfile, username, password, email, phone);
            await newVetInstance.register(assignedCertPath);
            showConfirmation("Registration submitted! Please wait for Admin approval.");  
            setTimeout(() => { window.location.href = "index.html"; }, 1500);       
            registerForm.reset();
            certGroup.classList.add('hidden');
        }
    });
});