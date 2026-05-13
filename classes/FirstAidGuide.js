class FirstAidGuide {
    #id;
    #title;
    #category;
    #steps;
    #videos;

    constructor(id, title, category, steps = [], videos = []) {
        this.#id = id;
        this.#title = title;
        this.#category = category;
        this.#steps = steps;
        this.#videos = videos;
    }

    // Getters
    getId() {
        return this.#id;
    }

    getTitle() {
        return this.#title;
    }

    getCategory() {
        return this.#category;
    }

    getSteps() {
        return this.#steps;
    }

    getVideos() {
        return this.#videos;
    }

    // UML methods
    addStep(stepNumber, instruction, imageURL) {
        const newStep = new Step(stepNumber, instruction, imageURL);
        this.#steps.push(newStep);
        return newStep;
    }

    addVideo(title, url) {
        const newVideo = new Video(title, url);
        this.#videos.push(newVideo);
        return newVideo;
    }

    removeStep(stepNumber) {
        this.#steps = this.#steps.filter(
            step => step.getStepNumber() !== stepNumber
        );
        // Renumber remaining steps so there are no gaps
        this.#steps.forEach((step, index) => {
            step.editStep({ stepNumber: index + 1 });
        });
    }

    removeVideo(title) {
        this.#videos = this.#videos.filter(
            video => video.getTitle() !== title
        );
    }

    viewGuide() {
        return {
            id: this.#id,
            title: this.#title,
            category: this.#category,
            steps: this.#steps.map(step => step.viewStep()),
            videos: this.#videos.map(video => video.viewVideo())
        };
    }

    editGuide(newData) {
        if (newData.title !== undefined) {
            this.#title = newData.title;
        }
        if (newData.category !== undefined) {
            this.#category = newData.category;
        }
    }

    deleteGuide() {
        this.#steps = [];
        this.#videos = [];
        this.#title = null;
        this.#category = null;
    }

    // Rebuild from JSON (localStorage data → class instances)
    static fromJSON(data) {
        const steps = data.steps.map(
            s => new Step(s.stepNumber, s.instruction, s.imageURL)
        );
        const videos = data.videos.map(
            v => new Video(v.title, v.url)
        );
        return new FirstAidGuide(data.id, data.title, data.category, steps, videos);
    }

    toJSON() {
        return {
            id: this.#id,
            title: this.#title,
            category: this.#category,
            steps: this.#steps.map(step => step.toJSON()),
            videos: this.#videos.map(video => video.toJSON())
        };
    }
}