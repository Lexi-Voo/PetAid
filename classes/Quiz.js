class Quiz {
    #id;
    #quizTitle;
    #category;
    #questions;
    #score;

    constructor(id, quizTitle, category, questions = [], score) {
        this.#id = id;
        this.#quizTitle = quizTitle;
        this.#category = category;  // dog, cat, rabbit, hamster
        this.#questions = questions; // array of QuizQuestion objects
        this.#score = 0;
    }

    addQuestion(id, questionText, options = [], correctAnswer) { 
        const newQuestion = new QuizQuestion(id, questionText, options, correctAnswer);
        this.#questions.push(newQuestion);
        return newQuestion;
    }
    editQuestion(id, updatedData) { 
        ...
    }
    startQuiz() { 
        return this.#questions.sort(() => Math.random() - 0.5);  // randomise order
    } 
    submitQuiz(answers) { 
        ... // answers = { questionId: selectedAnswer }
    } 
    updateScore(points) { 
        this.#score += points; 

    }
    getScore() { 
        return { score: this.#score, total: this.#questions.length }; 
    }
    viewQuiz() {
        return { id, title, category, questions, score }; 
    }
}