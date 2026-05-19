class Admin extends User {
    constructor(profile, email, password) {
        super(profile, email, password, "admin");
    }

    manageGuide(action, data) {
        let guides = loadGuides();

        switch (action) {
            case "create":
                const newId = "g" + Date.now();
                const newGuide = new FirstAidGuide(
                    newId,
                    data.title,
                    data.category
                );
                guides.push(newGuide);
                saveGuides(guides);
                return newGuide;

            case "edit":
                const guideToEdit = guides.find(
                    g => g.getId() === data.id
                );
                if (guideToEdit) {
                    guideToEdit.editGuide(data);
                    saveGuides(guides);
                }
                return guideToEdit;

            case "delete":
                guides = guides.filter(
                    g => g.getId() !== data.id
                );
                saveGuides(guides);
                return true;

            default:
                return null;
        }
    }

    manageStep(action, guideId, stepData) {
        const guides = loadGuides();
        const guide = guides.find(g => g.getId() === guideId);
        if (!guide) return null;

        switch (action) {
            case "add":
                guide.addStep(
                    stepData.stepNumber,
                    stepData.instruction,
                    stepData.imageURL
                );
                break;

            case "edit":
                const steps = guide.getSteps();
                const step = steps.find(
                    s => s.getStepNumber() === stepData.stepNumber
                );
                if (step) {
                    step.editStep(stepData);
                }
                break;

            case "remove":
                guide.removeStep(stepData.stepNumber);
                break;
        }

        saveGuides(guides);
        return guide;
    }

    manageVideo(action, guideId, videoData) {
        const guides = loadGuides();
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
                const video = videos.find(
                    v => v.getTitle() === videoData.oldTitle
                );
                if (video) {
                    video.editVideo(videoData);
                }
                break;
        }

        saveGuides(guides);
        return guide;
    }
}