// Core Logic
// Requires: config.js loaded before this file

const firebaseConfig = CONFIG.FIREBASE;

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized");
} catch (e) {
    console.error("Firebase Init Error:", e);
}

const db = firebase.firestore();

// --- Utility Functions (Now Async) ---

// GENERATE ID (Kept for frontend consistency, but Firebase creates its own too)
function generateId() {
    return 'CR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// FORMAT DATE
function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// --- DATABASE OPERATIONS ---

// SAVE COMPLAINT
async function saveComplaint(complaintData) {
    try {
        // Use set with custom ID or add for auto ID. 
        // We'll use set to keep our 'CR-XXXX' as the document ID for easier searching
        await db.collection("complaints").doc(complaintData.id).set(complaintData);
        return true;
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to save complaint: " + error.message);
        throw error;
    }
}

// GET SINGLE COMPLAINT
async function getComplaint(id) {
    try {
        const doc = await db.collection("complaints").doc(id).get();
        if (doc.exists) {
            return doc.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return null;
    }
}

// ADD MESSAGE
async function addMessage(complaintId, sender, text, attachment = null) {
    try {
        const docRef = db.collection("complaints").doc(complaintId);

        // We will store messages in a sub-collection for scalability
        // OR an array. Let's start with array for simplicity to match previous structure,
        // BUT Firestore arrays have limits. Sub-collection is better for chat.
        // HOWEVER, to keep migration simple and "message" rendering logic similar,
        // let's stick to the Array approach for now (messages field) using arrayUnion.

        const newMessage = {
            sender: sender,
            text: text,
            attachment: attachment,
            timestamp: new Date().toISOString()
        };

        await docRef.update({
            messages: firebase.firestore.FieldValue.arrayUnion(newMessage)
        });
        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
}

// Note: getMessages is removed because we should listen in real-time in the UI files directly.
// But for compatibility with existing synch code, we might need a helper, 
// but existing code expects a return value (array). We can't do that synchronously.
// We will modify status.js/helpers to use onSnapshot.

// GET ALL COMPLAINTS (For Investigator - One time fetch)
async function getAllComplaints() {
    try {
        const snapshot = await db.collection("complaints").orderBy("timestamp", "desc").get();
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error getting complaints:", error);
        return [];
    }
}

// UPDATE STATUS
async function updateComplaintStatus(id, newStatus) {
    try {
        await db.collection("complaints").doc(id).update({
            status: newStatus
        });
        return true;
    } catch (error) {
        console.error("Error updating status:", error);
        return false;
    }
}
