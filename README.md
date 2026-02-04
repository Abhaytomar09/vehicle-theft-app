# Vehicle Theft Complaint App

**Vehicle Theft Complaint App** is an AI-powered reporting & tracking system designed to streamline the process of reporting vehicle thefts and managing investigations.

## 🚀 Features

*   **Victim Portal**: Easy complaint registration with auto-location and file uploads.
*   **AI Verification**: Client-side TensorFlow.js model verifies if the uploaded image matches the vehicle type (e.g., detects "Car" if you selected "Car").
*   **Investigator Dashboard**: Secure portal to view complaints, update statuses, and chat with victims.
*   **Live Heatmap**: Interactive map showing high-theft density zones (Red Zones) and active case pins.
*   **Real-time Updates**: Status changes and chat messages sync instantly using Firebase Firestore.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3, JavaScript (ES6+)
*   **Database**: Firebase Firestore (NoSQL)
*   **AI/ML**: TensorFlow.js (Coco-SSD model)
*   **Maps**: Leaflet.js
*   **Notifications**: EmailJS

## 📦 Setup & Deployment

1.  Clone the repository.
2.  Rename `js/config.example.js` to `js/config.js`.
3.  Add your Firebase and EmailJS API keys in `js/config.js`.
4.  Open `index.html` to run.

## 🔐 Security Note

Sensitive API keys are stored in `js/config.js` which is excluded from this repository via `.gitignore` to prevent unauthorized usage.
