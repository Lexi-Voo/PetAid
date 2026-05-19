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
            options: this.shuffleOptions()
        };
    }

    validateAnswer(selectedAnswer) {
        return selectedAnswer === this.#correctAnswer;
    }

    shuffleOptions() {
        return [...this.#options].sort(() => Math.random() - 0.5);
    }

    saveQuizzes(quizzes) {
        const plainData = quizzes.map(quiz => ({
            id: quiz.getId(),
            title: quiz.getTitle(),
            category: quiz.getCategory(),

            questions: quiz.getQuestions().map(question => ({
                id: question.id,
                questionText: question.questionText,
                options: question.options,
                correctAnswer: question.correctAnswer
            })),

            score: quiz.getScore().score
        }));

        localStorage.setItem(
            QUIZ_STORAGE_KEY,
            JSON.stringify(plainData)
        );
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