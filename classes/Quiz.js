class Quiz {
    #id;
    #title;
    #category;
    #questions;
    #score;

    constructor(id, title, category, questions = [], score = 0) {
        this.#id = id;
        this.#title = title;
        this.#category = category;

        this.#questions = questions.map(q =>
            q instanceof QuizQuestion
                ? q
                : new QuizQuestion(
                    q.id,
                    q.questionText,
                    q.options,
                    q.correctAnswer
                )
        );

        this.#score = score;
    }

    // Getters
    getId() {
        return this.#id;
    }

    getCategory() {
        return this.#category;
    }

    getQuestions() {
        return this.#questions;
    }

    getScore() {
        return {
            score: this.#score,
            total: this.#questions.length
        };
    }

    // Setters
    setTitle(title) {
        this.#title = title;
    }

    setCategory(category) {
        this.#category = category;
    }

    // Question Management
    addQuestion(id, questionText, options = [], correctAnswer) {
        const newQuestion = new QuizQuestion(
            id,
            questionText,
            options,
            correctAnswer
        );

        this.#questions.push(newQuestion);

        return newQuestion;
    }

    editQuestion(id, updatedData) {
        const question = this.#questions.find(
            q => q.id === id
        );

        if (!question) return false;

        if (updatedData.questionText !== undefined) {
            question.setQuestionText(updatedData.questionText);
        }

        if (updatedData.options !== undefined) {
            question.setOptions(updatedData.options);
        }

        if (updatedData.correctAnswer !== undefined) {
            question.setCorrectAnswer(updatedData.correctAnswer);
        }

        return true;
    }

    removeQuestion(id) {
        this.#questions = this.#questions.filter(
            q => q.id !== id
        );
    }

    // Quiz Logic
    startQuiz() {
        return [...this.#questions].sort(
            () => Math.random() - 0.5
        );
    }

    submitQuiz(answers) {
        this.#score = 0;

        this.#questions.forEach(question => {
            if (
                question.validateAnswer(answers[question.id])
            ) {
                this.updateScore(1);
            }
        });

        return this.getScore();
    }

    updateScore(points) {
        this.#score += points;
    }

    // View
    viewQuiz() {
        return {
            id: this.#id,
            title: this.#title,
            category: this.#category,
            questions: this.#questions.map(q =>
                q.displayQuestion()
            ),
            score: this.#score
        };
    }

    // ===== JSON =====
    toJSON() {
        return {
            id: this.#id,
            title: this.#title,
            category: this.#category,
            questions: this.#questions.map(q => ({
                id: q.id,
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer
            })),
            score: this.#score
        };
    }

    static fromJSON(data) {
        return new Quiz(
            data.id,
            data.title,
            data.category,
            data.questions,
            data.score || 0
        );
    }
}