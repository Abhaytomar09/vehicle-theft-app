# Vehicle Theft Complaint App

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://cyber-guard-14eaa.web.app/)

**Vehicle Theft Complaint App** is an AI-powered reporting & tracking system designed to streamline the process of reporting vehicle thefts and managing investigations. It connects victims with investigators through a real-time platform featuring smart verification and interactive mapping.

## 🚀 Features

*   **🛡️ Victim Portal**: Secure and easy complaint registration.
    *   **Auto-Location**: Automatically captures incident location.
    *   **File Uploads**: Securely upload images of the stolen vehicle and FIR copies.
*   **🤖 AI Verification**: Built-in Client-side TensorFlow.js model verifies uploaded images.
    *   *Example*: If you select "Car", the AI checks if the image actually contains a car before allowing submission.
*   **🕵️ Investigator Dashboard**: Dedicated portal for authorities.
    *   View all active complaints in real-time.
    *   Update case status (Accepted, Solved, Rejected).
    *   Direct chat interface with victims.
*   **🗺️ Live Heatmap**: Interactive Leaflet map visualizing theft hotspots (Red Zones) and individual case pins.
*   **⚡ Real-time Updates**: Powered by **Firebase Firestore** for instant status sync and live chat.
*   **📧 Email Notifications**: Automated emails sent via **EmailJS** upon complaint registration and status updates.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3, JavaScript (ES6+)
*   **Database & Auth**: Firebase Firestore (NoSQL), Firebase Authentication
*   **AI/ML**: TensorFlow.js (Coco-SSD Pre-trained Model)
*   **Maps**: Leaflet.js (OpenStreetMap)
*   **Notifications**: EmailJS

## 📦 Setup & Deployment

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Abhaytomar09/vehicle-theft-app.git
    cd vehicle-theft-app
    ```

2.  **Configuration**
    *   Rename `js/config.example.js` to `js/config.js`.
    *   Open `js/config.js` and add your API keys:
        ```javascript
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
            projectId: "YOUR_PROJECT_ID",
            // ... other firebase config
        };
        // Add EmailJS keys if applicable
        ```

3.  **Run Locally**
    *   Simply open `index.html` in your browser.
    *   *Note*: For AI features to work correctly, it is recommended to use a local server (e.g., VS Code Live Server) to avoid CORS issues with model loading.

## 🔐 Security Note

Sensitive API keys are stored in `js/config.js` which is excluded from this repository via `.gitignore` to prevent unauthorized usage. Always ensure your keys are secured when deploying to production.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
