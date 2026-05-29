class PetOwner extends User {
    constructor(id, profile, username, password, email) {
        super(id, profile, username, password, email, "petowner");
    }
    async register() {
        const savedUsers = await loadAuthUsers(); 
        savedUsers.push(this);
        await saveAuthUsers(savedUsers); 
        this.login(); 
    }
    takeQuiz(quiz, answers) {
        if (!(quiz instanceof Quiz)) return null;
        return quiz.submitQuiz(answers);
    }
}
