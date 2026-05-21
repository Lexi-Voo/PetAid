document.addEventListener('DOMContentLoaded', () => {
    const activeUser = getCurrentUser();
    if (!activeUser || activeUser.getRole() !== 'admin') {
        alert("Access Denied: Admin role credentials required.");
        window.location.href = "login.html";
        return;
    }
    const adminQueueBody = document.getElementById('adminQueueBody');
    const requestsTable = document.getElementById('requestsTable');
    const emptyQueueMsg = document.getElementById('emptyQueueMsg');

    async function renderAdminQueue() {
        try {
            let response = await fetch(`data/approvals.JSON?_=${Date.now()}`);
            if (!response.ok) {
                console.log("Approvals: .JSON failed, trying fallback to .json...");
                response = await fetch(`data/approvals.json?_=${Date.now()}`);
            }
            const pendingRequests = await response.json();
            localStorage.setItem('petaid_approvals', JSON.stringify(pendingRequests));
            if (!pendingRequests || pendingRequests.length === 0) {
                requestsTable.classList.add('hidden');
                emptyQueueMsg.classList.remove('hidden');
                return;
            }
            requestsTable.classList.remove('hidden');
            emptyQueueMsg.classList.add('hidden');

            adminQueueBody.innerHTML = pendingRequests.map(req => `
                <tr>
                    <td style="font-weight: bold; color: #2c3e50;">${req.name}</td>
                    <td><code>${req.username}</code></td>
                    <td><a href="${req.cert_path || '#'}" target="_blank" class="cert-link">View Certificate 📄</a></td>
                    <td style="color: #7f8c8d; font-family: monospace;">${req.phone || 'N/A'}</td>
                    <td>
                        <button class="btn-approve" onclick="handleAdminAction('${req.req_id}', 'approve')">Approve</button>
                        <button class="btn-reject" onclick="handleAdminAction('${req.req_id}', 'reject')">Reject</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error("Error loading physical approvals file:", err);
            requestsTable.classList.add('hidden');
            emptyQueueMsg.classList.remove('hidden');
        }
    }

    window.handleAdminAction = async function(requestId, actionType) {
        try {
            let response = await fetch(`data/approvals.JSON?_=${Date.now()}`);
            if (!response.ok) {
                response = await fetch(`data/approvals.json?_=${Date.now()}`);
            }
            const currentApprovalsList = await response.json();
            const targetIndex = currentApprovalsList.findIndex(a => a.req_id === requestId);
            if (targetIndex === -1) return;
            const targetRequest = currentApprovalsList[targetIndex];

            if (actionType === 'approve') {
                const currentMasterUsers = loadAuthUsers();
                let maxUserId = 0;
                currentMasterUsers.forEach(u => {
                    const idNum = parseInt(u.getId()); 
                    if (!isNaN(idNum) && idNum > maxUserId) { maxUserId = idNum; }
                });
                const newUserId = (maxUserId + 1).toString();
                const newProfile = new UserProfile(
                    targetRequest.name, 
                    targetRequest.biography || `Approved Vet. Registered on ${new Date().toISOString().split('T')[0]}.`, 
                    "assets/profiles/profile.jpg"
                );
                const approvedVetInstance = new Veterinarian(newUserId, newProfile, targetRequest.username, targetRequest.password, targetRequest.email, targetRequest.phone);
                approvedVetInstance.cert_path = targetRequest.cert_path || "assets/certs/cert.jpg";
                currentMasterUsers.push(approvedVetInstance);
                saveAuthUsers(currentMasterUsers); 
                showConfirmation(`Approved: ${targetRequest.name} migrated to system registry successfully.`);
            } else {
                showConfirmation(`Rejected application workflow for ${targetRequest.name}.`, true);
            }
            currentApprovalsList.splice(targetIndex, 1);
            saveApprovals(currentApprovalsList);
            setTimeout(() => { renderAdminQueue(); }, 200);
        } catch (err) {
            console.error("Failed to execute administration action sequence:", err);
            showConfirmation("System error: Operation aborted.", true);
        }
    };
    renderAdminQueue();
});