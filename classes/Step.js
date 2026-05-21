class Step {
    #stepNumber;
    #instruction;
    #imageURL;

    constructor(stepNumber, instruction, imageURL = "") {
        this.#stepNumber = stepNumber;
        this.#instruction = instruction;
        this.#imageURL = imageURL;
    }

    getStepNumber() {
        return this.#stepNumber;
    }

    getInstruction() {
        return this.#instruction;
    }

    getImageURL() {
        return this.#imageURL;
    }

    viewStep() {
        return {
            stepNumber: this.#stepNumber,
            instruction: this.#instruction,
            imageURL: this.#imageURL
        };
    }

    editStep(newData) {
        if (newData.stepNumber !== undefined) {
            this.#stepNumber = newData.stepNumber;
        }
        if (newData.instruction !== undefined) {
            this.#instruction = newData.instruction;
        }
        if (newData.imageURL !== undefined) {
            this.#imageURL = newData.imageURL;
        }
    }

    toJSON() {
        return {
            stepNumber: this.#stepNumber,
            instruction: this.#instruction,
            imageURL: this.#imageURL
        };
    }
}