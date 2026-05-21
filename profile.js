document.addEventListener('DOMContentLoaded', () => {
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

    let bioSnapshotCache = "";
    const activeProfile = activeUser.getProfile();
    displayName.textContent = activeProfile.getName() || "User";
    displayRole.textContent = activeUser.getRole() === "petowner" ? "Pet Owner" : (activeUser.getRole() === "veterinarian" ? "Veterinarian" : activeUser.getRole());
    displayUsername.textContent = activeUser.getUsername() || "None";
    biographyInput.value = activeProfile.getBiography() || "";
    displayAvatar.src = activeProfile.getProfilePic() || "assets/profiles/profile.jpg";

    function renderUserPets() {
        const myPets = getPetsByOwnerId(activeUser.getId());
        if (myPets.length === 0) {
            petGridContainer.innerHTML = `<p style="color:#7f8c8d; font-style:italic;">No pets registered under this account yet.</p>`;
        } else {
            petGridContainer.innerHTML = myPets.map(pet => `
                <div class="pet-card" style="cursor: pointer;" onclick="window.location.href='petProfile.html?id=${pet.pet_id}'">
                    <img src="${pet.pet_img || 'assets/petprofile/dog.jpg'}" alt="${pet.name}">
                    <div class="pet-title">${pet.name} 🔗</div>
                    <div class="pet-desc">${pet.category}</div>
                    <p style="font-size:11px; margin:5px 0 0 0; color:#95a5a6;">"${pet.pet_bio || ''}"</p>
                </div>
            `).join('');
        }
    }

    if (activeUser.getRole() === 'petowner') {
        addPetPanel.classList.remove('hidden');
        petsPanel.classList.remove('hidden');
        renderUserPets();
    } else if (activeUser.getRole() === 'veterinarian') {
        vetCertPanel.classList.remove('hidden'); 
        displayVetCert.href = activeUser.cert_path || '#'; 
    }
    
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

                const allUsers = loadAuthUsers();
                const userIndex = allUsers.findIndex(u => u.getId() === activeUser.getId());
                
                if (userIndex !== -1) {
                    activeUser.getProfile().setProfilePic(diskPath);
                    allUsers[userIndex] = activeUser; 
                    localStorage.setItem('petaid_active_session', JSON.stringify(activeUser.toJSON()));
                    saveAuthUsers(allUsers);
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

    let isBioEditing = false;
    bioToggleBtn.addEventListener('click', () => {
        if (!isBioEditing) {
            bioSnapshotCache = biographyInput.value;
            isBioEditing = true;
            biographyInput.removeAttribute('disabled');
            biographyInput.focus();
            bioToggleBtn.textContent = "Save Changes";
            bioToggleBtn.className = "btn btn-save";
            bioCancelBtn.classList.remove('hidden');
        } else {
            const allUsers = loadAuthUsers();
            const userIndex = allUsers.findIndex(u => u.getId() === activeUser.getId());
            if (userIndex !== -1) {
                activeUser.getProfile().setBiography(biographyInput.value.trim());
                allUsers[userIndex] = activeUser;
                localStorage.setItem('petaid_active_session', JSON.stringify(activeUser.toJSON()));
                saveAuthUsers(allUsers);
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
            const allPets = loadPets();
            
            let maxPetId = 0;
            allPets.forEach(pet => {
                const idNum = parseInt(pet.pet_id);
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

            const newPet = {
                "pet_id": newPetId,
                "owner_id": activeUser.getId(),
                "name": pName,
                "category": pCategory,
                "pet_bio": pBio,
                "pet_img": finalImgPath
            };
            allPets.push(newPet);
            savePets(allPets);
            petForm.reset();
            renderUserPets();    
            showConfirmation("New pet added successfully!");
            isPetEditing = false;
            fields.forEach(f => f.setAttribute('disabled', 'true'));
            petToggleBtn.textContent = "Add New Pet";
            petToggleBtn.className = "btn btn-edit";
            petCancelBtn.classList.add('hidden');
        }
    });
});