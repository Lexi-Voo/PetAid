class QuizQuestion {
    #id;
    #questionText;
    #options;
    #correctAnswer;

    constructor(id, questionText, options = [], correctAnswer) {
        this.id = id;
        this.questionText = questionText;
        this.options = options;          // array of 4 strings
        this.correctAnswer = correctAnswer; // index 0-3 or the string itself
    }

    displayQuestion() {
        return {
            id: this.id,
            questionText: this.questionText,
            options: this.shuffleOptions()
        };
    }

    validateAnswer(selectedAnswer) {
        return selectedAnswer === this.correctAnswer;
    }

    shuffleOptions() {
        // Returns a shuffled copy, keeping track of correct answer by value
        return [...this.options].sort(() => Math.random() - 0.5);
    }
}