class Admin extends User {
    constructor(id, profile, username, password, email) {
        super(id, profile, username, password, email, "admin");
    }

    async manageGuide(action, data) {
        let guides = await loadGuides();

        switch (action) {
            case "create":
                const newId = "g" + Date.now();
                const newGuide = new FirstAidGuide(newId, data.title, data.category);
                guides.push(newGuide);
                await saveGuides(guides);
                return newGuide;

            case "edit":
                const guideToEdit = guides.find(g => g.getId() === data.id);
                if (guideToEdit) {
                    guideToEdit.editGuide(data);
                    await saveGuides(guides);
                }
                return guideToEdit;

            case "delete":
                const guideToDelete = guides.find(g => g.getId() === data.id);
                if (guideToDelete) guideToDelete.deleteGuide();
                guides = guides.filter(g => g.getId() !== data.id);
                await saveGuides(guides);
                return true;

            default:
                return null;
        }
    }

    async manageStep(action, guideId, stepData) {
        const guides = await loadGuides();
        const guide = guides.find(g => g.getId() === guideId);
        if (!guide) return null;

        switch (action) {
            case "add":
                guide.addStep(stepData.stepNumber, stepData.instruction, stepData.imageURL);
                break;
            case "edit":
                const steps = guide.getSteps();
                const step = steps.find(s => s.getStepNumber() === stepData.stepNumber);
                if (step) step.editStep(stepData);
                break;
            case "remove":
                guide.removeStep(stepData.stepNumber);
                break;
        }

        await saveGuides(guides);
        return guide;
    }

    async manageVideo(action, guideId, videoData) {
        const guides = await loadGuides();
        const guide = guides.find(g => g.getId() === guideId);
        if (!guide) return null;

        switch (action) {
            case "add":
                guide.addVideo(videoData.title, videoData.url);
                break;
            case "remove":
                guide.removeVideo(videoData.title);
                break;
            case "edit":
                const videos = guide.getVideos();
                const video = videos.find(v => v.getTitle() === videoData.oldTitle);
                if (video) video.editVideo(videoData);
                break;
        }

        await saveGuides(guides);
        return guide;
    }

    async manageQuestion(action, quizId, questionData) {
        const quizzes = await loadQuizzes();
        const quiz = quizzes.find(q => q.getId() === quizId);
        if (!quiz) return false;

        switch (action) {
            case "add":
                quiz.addQuestion(questionData.id, questionData.questionText, questionData.options, questionData.correctAnswer);
                break;
            case "edit":
                quiz.editQuestion(questionData.id, {
                    questionText: questionData.questionText,
                    options: questionData.options,
                    correctAnswer: questionData.correctAnswer
                });
                break;
            case "remove":
                quiz.removeQuestion(questionData.id);
                break;
        }

        await saveQuizzes(quizzes);
        return true;
    }

    async manageQuiz(action, quizData) {
        let quizzes = await loadQuizzes();

        switch (action) {
            case "edit":
                const quiz = quizzes.find(q => q.getId() === quizData.id);
                if (!quiz) return false;
                quiz.setTitle(quizData.title);
                quiz.setCategory(quizData.category);
                break;
            case "delete":
                quizzes = quizzes.filter(q => q.getId() !== quizData.id);
                break;
            case "create":
                const newQuiz = new Quiz("qz" + Date.now(), quizData.title, quizData.category, []);
                quizzes.push(newQuiz);
                break;
        }

        await saveQuizzes(quizzes);
        return true;
    }

    async approveVet(targetRequest, actionType) {
        if (!targetRequest) return false;
        if (actionType === 'approve') {
            const currentMasterUsers = await loadAuthUsers();
            let maxUserId = 0;
            currentMasterUsers.forEach(u => {
                const idNum = parseInt(u.getId());
                if (!isNaN(idNum) && idNum > maxUserId) maxUserId = idNum;
            });
            const newUserId = (maxUserId + 1).toString();
            const newProfile = new UserProfile(
                targetRequest.name,
                targetRequest.biography || `Approved Vet. Registered on ${new Date().toISOString().split('T')[0]}.`,
                "assets/profiles/profile.jpg",
                targetRequest.phone || ""
            );
            const approvedVetInstance = new Veterinarian(
                newUserId, newProfile, targetRequest.username,
                targetRequest.password, targetRequest.email, targetRequest.phone || ""
            );
            approvedVetInstance.cert_path = targetRequest.cert_path || "assets/certs/cert.jpg";
            currentMasterUsers.push(approvedVetInstance);
            await saveAuthUsers(currentMasterUsers);
            return { success: true, action: "approved" };
        } else if (actionType === 'reject') {
            return { success: true, action: "rejected" };
        }
        return false;
    }
}
