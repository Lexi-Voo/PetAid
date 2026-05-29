document.addEventListener('DOMContentLoaded', async () => {
    const activeUser = getCurrentUser();
    if (!activeUser) {
        window.location.href = "login.html";
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const targetPetId = urlParams.get('id');

    if (!targetPetId) {
        window.location.href = "profile.html";
        return;
    }
    const allPets = await loadPets();
    const currentPet = allPets.find(p => p.getPetId() === targetPetId);
    if (!currentPet || currentPet.getOwnerId().toString() !== activeUser.getId().toString()) {
        showConfirmation("Error: Pet record missing or unauthorized.", true);
        setTimeout(() => { window.location.href = "profile.html"; }, 1500);
        return;
    }
    const displayPetImg = document.getElementById('displayPetImg');
    const displayPetName = document.getElementById('displayPetName');
    const displayPetCategory = document.getElementById('displayPetCategory');
    const displayPetBio = document.getElementById('displayPetBio');
    const editPetName = document.getElementById('editPetName');
    const editPetCategory = document.getElementById('editPetCategory');
    const editPetBio = document.getElementById('editPetBio');
    const petImgUploader = document.getElementById('petImgUploader');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const editPetForm = document.getElementById('editPetForm');
    const petToggleBtn = document.getElementById('petToggleBtn');
    const petCancelBtn = document.getElementById('petCancelBtn');

    let nameCacheSnapshot = "";
    let categoryCacheSnapshot = "";
    let bioCacheSnapshot = "";

    renderNavbar("");
    function populateUI(pet) {
        displayPetImg.src = pet.getPetImg() || 'assets/petprofile/dog.jpg';
        displayPetName.textContent = pet.getName();
        displayPetCategory.textContent = pet.getCategory();
        displayPetBio.textContent = pet.getPetBio() ? `"${pet.getPetBio()}"` : "No biography recorded.";
        editPetName.value = pet.getName();
        editPetCategory.value = pet.getCategory();
        editPetBio.value = pet.getPetBio() || "";
    }

    populateUI(currentPet);

    if (changePhotoBtn && petImgUploader) {
        changePhotoBtn.addEventListener('click', () => { petImgUploader.click(); });
        petImgUploader.addEventListener('change', async (e) => {
            const targetFile = e.target.files[0];
            if (!targetFile) return;
            const formData = new FormData();
            formData.append('id', targetPetId);
            formData.append('uploadType', 'pet'); 
            formData.append('image', targetFile);

            try {
                const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    const diskPath = result.savedPath;
                    displayPetImg.src = diskPath;

                    const petIndex = allPets.findIndex(p => p.getPetId() === targetPetId);
                    if (petIndex !== -1) {
                        allPets[petIndex].setPetImg(diskPath);
                        await savePets(allPets); 
                        
                        showConfirmation("Pet profile picture updated successfully!");
                        setTimeout(() => { window.location.reload(); }, 1000);
                    }
                } else {
                    showConfirmation("Error: " + result.message, true);
                }
            } catch (err) {
                console.error("Pet image network failure:", err);
                showConfirmation("Error: Image sync failed.", true);
            }
        });
    }

    if (petToggleBtn) {
        let isEditing = false;
        petToggleBtn.addEventListener('click', async () => {
            const inputFields = editPetForm.querySelectorAll('input, select, textarea');
            if (!isEditing) {
                nameCacheSnapshot = editPetName.value;
                categoryCacheSnapshot = editPetCategory.value;
                bioCacheSnapshot = editPetBio.value;
                isEditing = true;
                inputFields.forEach(field => field.removeAttribute('disabled'));
                editPetName.focus();
                petToggleBtn.textContent = "Save Changes";
                petToggleBtn.className = "btn btn-save";
                if (petCancelBtn) petCancelBtn.classList.remove('hidden');
            } else {
                const finalName = editPetName.value.trim();
                if (!finalName) {
                    showConfirmation("Error: Pet Name cannot be left completely blank.", true);
                    editPetName.focus();
                    return;
                }
                
                const petIndex = allPets.findIndex(p => p.getPetId() === targetPetId);
                if (petIndex !== -1) {
                    allPets[petIndex].updateDetails({
                        name: finalName,
                        category: editPetCategory.value,
                        petBio: editPetBio.value.trim()
                    });

                    await savePets(allPets); 
                    populateUI(allPets[petIndex]);
                    showConfirmation("Pet details synced directly to storage changes!");
                }
                isEditing = false;
                inputFields.forEach(field => field.setAttribute('disabled', 'true'));
                petToggleBtn.textContent = "Edit Pet Information";
                petToggleBtn.className = "btn btn-edit";
                if (petCancelBtn) petCancelBtn.classList.add('hidden');
            }
        });

        if (petCancelBtn) {
            petCancelBtn.addEventListener('click', () => {
                const inputFields = editPetForm.querySelectorAll('input, select, textarea');
                isEditing = false;
                editPetName.value = nameCacheSnapshot;
                editPetCategory.value = categoryCacheSnapshot;
                editPetBio.value = bioCacheSnapshot;
                inputFields.forEach(field => field.setAttribute('disabled', 'true'));
                petToggleBtn.textContent = "Edit Pet Information";
                petToggleBtn.className = "btn btn-edit";
                petCancelBtn.classList.add('hidden');
            });
        }
    }
});