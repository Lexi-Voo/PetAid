class PetOwner extends User {
    constructor(id, profile, username, password, email) {
        super(id, profile, username, password, email, "petowner");
    }
    register() {
        const savedUsers = loadAuthUsers(); 
        savedUsers.push(this);
        saveAuthUsers(savedUsers); 
        this.login(); 
    }
}