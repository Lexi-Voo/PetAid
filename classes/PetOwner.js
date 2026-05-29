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
}
