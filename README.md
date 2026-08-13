# PetAid

PetAid is a comprehensive web application designed to assist pet owners with their pets' health and well-being. It provides resources such as first aid guides, interactive quizzes, a map to locate nearby veterinary clinics, community forums, and profiles to manage pet information.

---

## Features

- **First Aid Guides**: Access step-by-step guides for various pet emergencies and health situations.
- **Interactive Quizzes**: Test your knowledge on pet care and first aid.
- **Clinic Map**: Locate nearby veterinary clinics and services on an interactive map.
- **Community Forum**: Engage with other pet owners, ask questions, and share experiences.
- **User & Pet Profiles**: Create and manage profiles for yourself and your pets, including uploading photos and certificates.
- **Admin Dashboard**: For administrators to review approvals, manage content, and oversee the platform.
- **Feedback System**: Provide feedback to help improve the PetAid platform.

---

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Data Storage** | Local JSON files (no database required for local development) |
| **File Uploads** | Multer |

---

## Project Structure

```text
/
├── assets/         # Stores uploaded images (user profiles, pet profiles, certificates, guides) and other static media
├── data/           # Contains JSON files used for data persistence (user.JSON, pets.JSON, forum.JSON, clinics.json, etc.)
├── css/            # Stylesheets for the application
├── components/     # Reusable modular frontend code
├── classes/        # Reusable modular frontend code
├── utils/          # Reusable modular frontend code
├── server.js       # The main entry point for the Node.js Express static server and JSON API endpoints
└── *.html & *.js   # Frontend pages and their corresponding logic scripts (e.g., index.html, map-page.js)
```

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js and npm (Node Package Manager) installed on your system.
- Download Node.js: [https://nodejs.org/](https://nodejs.org/)

### Installation

1. Clone or download this repository to local machine.

2. Install the required dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   *(Alternatively, you can run `node server.js`)*

2. Open your web browser and navigate to:
   ```text
   http://localhost:3000/index.html
   ```

3. To stop the server, press `Ctrl + C` in the terminal where the server is running.

---

## Usage

- **Home Page**: The entry point providing an overview of the platform (`index.html`).
- **Register / Login**: Create a new account or log in to access personalized features like pet profiles and forum posting (`register.html`, `login.html`).
- **Map**: View clinics near your location (`Map.html`).
- **First Aid / Guides**: Browse essential health and safety tutorials (`firstAid.html`, `guideView.html`).
- **Quizzes**: Test your knowledge (`quiz.html`, `quizView.html`).
- **Forum**: Interact with the community (`forum.html`).
- **Profile**: Manage your user profile and registered pets (`profile.html`, `petProfile.html`).
- **Admin**: Accessible via `/admin.html` for moderation and data management.

---

## Note

This project uses a simple file-based JSON storage mechanism intended for local prototyping and development.
