document.addEventListener('DOMContentLoaded', async () => {
    const activeUser = getCurrentUser(); 
    if (!activeUser) {
        alert("Access Denied. Please log in first.");
        window.location.href = "login.html";
        return;
    }
    const displayAvatar = document.getElementById('displayAvatar');
    const changeOwnerPhotoBtn = document.getElementById('changeOwnerPhotoBtn');
    const ownerImgUploader = document.getElementById('ownerImgUploader');
    const displayName = document.getElementById('displayName');
    const displayRole = document.getElementById('displayRole');
    const displayUsername = document.getElementById('displayUsername');
    const biographyInput = document.getElementById('biographyInput');
    const bioToggleBtn = document.getElementById('bioToggleBtn');
    const bioCancelBtn = document.getElementById('bioCancelBtn');
    const addPetPanel = document.getElementById('addPetPanel');
    const petsPanel = document.getElementById('petsPanel');
    const petGridContainer = document.getElementById('petGridContainer');
    const petForm = document.getElementById('petForm');
    const petToggleBtn = document.getElementById('petToggleBtn');
    const petCancelBtn = document.getElementById('petCancelBtn');
    const petImgFile = document.getElementById('petImgFile');
    
    const vetCertPanel = document.getElementById('vetCertPanel');
    const displayVetCert = document.getElementById('displayVetCert');
    const vetPhonePanel = document.getElementById('vetPhonePanel');
    const phoneInput = document.getElementById('phoneInput');
    const phoneToggleBtn = document.getElementById('phoneToggleBtn');
    const phoneCancelBtn = document.getElementById('phoneCancelBtn');
    
    let phoneSnapshotCache = "";
    let bioSnapshotCache = "";

    const activeProfile = activeUser.getProfile();
    const profileData = activeProfile.viewProfile();

    displayName.textContent = profileData.name || "User";
    displayUsername.textContent = activeUser.getUsername() || "None";
    biographyInput.value = profileData.bio || "";
    displayAvatar.src = profileData.profilePicture || "assets/profiles/profile.jpg";

    let displayRoleText = activeUser.getRole();
    if (displayRoleText === "petowner") displayRoleText = "Pet Owner";
    if (displayRoleText === "veterinarian") displayRoleText = "Veterinarian";
    displayRole.textContent = displayRoleText;

    async function renderUserPets() {
        const myPets = await getPetsByOwnerId(activeUser.getId());
        if (myPets.length === 0) {
            petGridContainer.innerHTML = `<p style="color:#7f8c8d; font-style:italic;">No pets registered under this account yet.</p>`;
        } else {
            petGridContainer.innerHTML = myPets.map(pet => `
                <div class="pet-card" style="cursor: pointer;" onclick="window.location.href='petProfile.html?id=${pet.getPetId()}'">
                    <img src="${pet.getPetImg() || 'assets/petprofile/dog.jpg'}" alt="${pet.getName()}">
                    <div class="pet-title">${pet.getName()} 🔗</div>
                    <div class="pet-desc">${pet.getCategory()}</div>
                    <p style="font-size:11px; margin:5px 0 0 0; color:#95a5a6;">"${pet.getPetBio() || ''}"</p>
                </div>
            `).join('');
        }
    }
    if (activeUser.getRole() === 'petowner') {
        if(addPetPanel) addPetPanel.classList.remove('hidden');
        if(petsPanel) petsPanel.classList.remove('hidden');
        await renderUserPets();
    } 
    else if (activeUser.getRole() === 'veterinarian') {
        if(vetCertPanel) vetCertPanel.classList.remove('hidden'); 
        if(displayVetCert) displayVetCert.href = activeUser.cert_path || '#'; 
        
        if (vetPhonePanel && phoneInput) {
            vetPhonePanel.classList.remove('hidden');
            phoneInput.value = profileData.phoneNumber || "";
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9+\-\s]/g, '');
            });
        }
    }
    if (phoneToggleBtn && phoneInput) {
        let isPhoneEditing = false;
        phoneToggleBtn.addEventListener('click', async () => {
            if (!isPhoneEditing) {
                phoneSnapshotCache = phoneInput.value;
                isPhoneEditing = true;
                phoneInput.removeAttribute('disabled');
                phoneInput.focus();
                phoneToggleBtn.textContent = "Save Phone";
                phoneToggleBtn.className = "btn btn-save";
                phoneCancelBtn.classList.remove('hidden');
            } else {
                if (!phoneInput.checkValidity()) {
                    phoneInput.reportValidity();
                    return;
                }

                const allUsers = await loadAuthUsers();
                const userIndex = allUsers.findIndex(u => u.getId() === activeUser.getId());
                if (userIndex !== -1) {
                    activeUser.getProfile().updateProfile({ phoneNumber: phoneInput.value.trim() });
                    if (typeof activeUser.setPhone === 'function') {
                        activeUser.setPhone(phoneInput.value.trim());
                    }
                    allUsers[userIndex] = activeUser;
                    //localStorage.setItem('petaid_active_session', JSON.stringify(activeUser.toJSON()));
                    updateSession(activeUser);
                    await saveAuthUsers(allUsers);
                    showConfirmation("Contact number saved successfully!");
                }
                isPhoneEditing = false;
                phoneInput.setAttribute('disabled', 'true');
                phoneToggleBtn.textContent = "Edit Phone";
                phoneToggleBtn.className = "btn btn-edit";
                phoneCancelBtn.classList.add('hidden');
            }
        });

        phoneCancelBtn.addEventListener('click', () => {
            isPhoneEditing = false;
            phoneInput.value = phoneSnapshotCache;
            phoneInput.setAttribute('disabled', 'true');
            phoneToggleBtn.textContent = "Edit Phone";
            phoneToggleBtn.className = "btn btn-edit";
            phoneCancelBtn.classList.add('hidden');
        });
    }

    if (bioToggleBtn && biographyInput) {
        let isBioEditing = false;
        bioToggleBtn.addEventListener('click', async () => {
            if (!isBioEditing) {
                bioSnapshotCache = biographyInput.value;
                isBioEditing = true;
                biographyInput.removeAttribute('disabled');
                biographyInput.focus();
                bioToggleBtn.textContent = "Save Changes";
                bioToggleBtn.className = "btn btn-save";
                bioCancelBtn.classList.remove('hidden');
            } else {
                const allUsers = await loadAuthUsers();
                const userIndex = allUsers.findIndex(u => u.getId() === activeUser.getId());
                if (userIndex !== -1) {
                    activeUser.getProfile().updateProfile({ biography: biographyInput.value.trim() });
                    allUsers[userIndex] = activeUser;
                    //localStorage.setItem('petaid_active_session', JSON.stringify(activeUser.toJSON()));
                    updateSession(activeUser);
                    await saveAuthUsers(allUsers);
                    showConfirmation("Biography saved successfully!");
                }
                isBioEditing = false;
                biographyInput.setAttribute('disabled', 'true');
                bioToggleBtn.textContent = "Edit Biography";
                bioToggleBtn.className = "btn btn-edit";
                bioCancelBtn.classList.add('hidden');
            }
        });

        bioCancelBtn.addEventListener('click', () => {
            isBioEditing = false;
            biographyInput.value = bioSnapshotCache;
            biographyInput.setAttribute('disabled', 'true');
            bioToggleBtn.textContent = "Edit Biography";
            bioToggleBtn.className = "btn btn-edit";
            bioCancelBtn.classList.add('hidden');
        });
    }

    if (changeOwnerPhotoBtn && ownerImgUploader) {
        changeOwnerPhotoBtn.addEventListener('click', () => { ownerImgUploader.click(); });
        ownerImgUploader.addEventListener('change', async (e) => {
            const targetFile = e.target.files[0];
            if (!targetFile) return;
            const formData = new FormData();
            formData.append('id', activeUser.getId());
            formData.append('uploadType', 'user'); 
            formData.append('image', targetFile);

            try {
                const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    const diskPath = result.savedPath;
                    displayAvatar.src = diskPath;

                    const allUsers = await loadAuthUsers();
                    const userIndex = allUsers.findIndex(u => u.getId() === activeUser.getId());
                    if (userIndex !== -1) {
                        activeUser.getProfile().updateProfile({ profilePic: diskPath });
                        allUsers[userIndex] = activeUser; 
                        //localStorage.setItem('petaid_active_session', JSON.stringify(activeUser.toJSON()));
                        updateSession(activeUser);
                        await saveAuthUsers(allUsers);
                        showConfirmation("Profile picture written to disk and saved successfully!");
                    }
                } else {
                    showConfirmation("Error: " + result.message, true);
                }
            } catch (err) {
                console.error("Profile upload network error:", err);
                showConfirmation("Error: Could not sync image to disk server.", true);
            }
        });
    }

    if (petToggleBtn && petForm) {
        let isPetEditing = false;
        petToggleBtn.addEventListener('click', async () => {
            const fields = petForm.querySelectorAll('input, select, textarea');
            if (!isPetEditing) {
                isPetEditing = true;
                fields.forEach(f => f.removeAttribute('disabled'));
                document.getElementById('petName').focus();
                petToggleBtn.textContent = "Save Pet Details";
                petToggleBtn.className = "btn btn-save";
                petCancelBtn.classList.remove('hidden');
            } else {
                const pName = document.getElementById('petName').value.trim();
                if (!pName) {
                    showConfirmation("Error: Pet Name field is required.", true);
                    document.getElementById('petName').focus();
                    return;
                }
                const pCategory = document.getElementById('petCategory').value;
                const pBio = document.getElementById('petBio').value.trim();
                const allPets = await loadPets();
                
                let maxPetId = 0;
                allPets.forEach(pet => {
                    const idNum = parseInt(pet.getPetId()); // Read via getPetId getter
                    if (!isNaN(idNum) && idNum > maxPetId) { maxPetId = idNum; }
                });
                const newPetId = (maxPetId + 1).toString();
                let finalImgPath = 'assets/petprofile/dog.jpg'; 

                const selectedFile = petImgFile.files[0];
                if (selectedFile) {
                    const formData = new FormData();
                    formData.append('id', newPetId);
                    formData.append('uploadType', 'pet'); 
                    formData.append('image', selectedFile);
                    try {
                        const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.success) { finalImgPath = result.savedPath; }
                    } catch (err) { console.error("Pet avatar streaming failure:", err); }
                }

                const newPetInstance = new Pet(newPetId, activeUser.getId(), pName, pCategory, pBio, finalImgPath);
                
                allPets.push(newPetInstance);
                await savePets(allPets); 
                
                petForm.reset();
                await renderUserPets();    
                showConfirmation("New pet added successfully!");
                isPetEditing = false;
                fields.forEach(f => f.setAttribute('disabled', 'true'));
                petToggleBtn.textContent = "Add New Pet";
                petToggleBtn.className = "btn btn-edit";
                petCancelBtn.classList.add('hidden');
            }
        });
        
        petCancelBtn.addEventListener('click', () => {
            const fields = petForm.querySelectorAll('input, select, textarea');
            isPetEditing = false;
            petForm.reset();
            fields.forEach(f => f.setAttribute('disabled', 'true'));
            petToggleBtn.textContent = "Add New Pet";
            petToggleBtn.className = "btn btn-edit";
            petCancelBtn.classList.add('hidden');
        });
    }
});