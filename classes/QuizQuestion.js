class QuizQuestion {
    #id;
    #questionText;
    #options;
    #correctAnswer;

    constructor(id, questionText, options = [], correctAnswer) {
        this.#id = id;
        this.#questionText = questionText;
        this.#options = options;
        this.#correctAnswer = correctAnswer;
    }

    displayQuestion() {
        return {
            id: this.#id,
            questionText: this.#questionText,
            options: this.shuffleOptions(),
            correctAnswer: this.#correctAnswer
        };
    }

    validateAnswer(selectedAnswer) {
        return selectedAnswer === this.#correctAnswer;
    }

    shuffleOptions() {
        return [...this.#options].sort(() => Math.random() - 0.5);
    }

    // Getters
    get id() {
        return this.#id;
    }

    get questionText() {
        return this.#questionText;
    }

    get options() {
        return this.#options;
    }

    get correctAnswer() {
        return this.#correctAnswer;
    }

    // Setters
    setQuestionText(text) {
        this.#questionText = text;
    }

    setOptions(options) {
        this.#options = options;
    }

    setCorrectAnswer(answer) {
        this.#correctAnswer = answer;
    }
}