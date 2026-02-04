// Requires config.js

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const navActions = document.getElementById('navActions');
    const loginBtn = document.getElementById('loginBtn');
    const passkeyInput = document.getElementById('passkey');
    const loginError = document.getElementById('loginError');

    // Login Logic
    loginBtn.addEventListener('click', () => {
        if (passkeyInput.value === CONFIG.PASSKEY) {
            loginScreen.style.display = 'none';
            dashboard.style.display = 'block';
            navActions.style.display = 'block';

            // Initialize Map NOW (when div is visible)
            setTimeout(initHeatmap, 100); // Small delay to ensuring DOM rendering

            renderComplaints();
        } else {
            loginError.style.display = 'block';
            passkeyInput.value = '';
        }
    });

    // Handle Enter key for login
    passkeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    // Chat Logic
    document.getElementById('adminSendBtn').addEventListener('click', sendAdminMessage);
    document.getElementById('adminChatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAdminMessage();
    });

    // Admin Attach Button
    document.getElementById('adminAttachBtn').addEventListener('click', () => document.getElementById('adminFileInput').click());

    // Admin File Input
    document.getElementById('adminFileInput').addEventListener('change', handleAdminFile);
});

let openChatId = null;
let allComplaints = [];

// Initialize Filter Listener
// Initialize Filter Listener
// Initialize Filter Listener
document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('statusFilter');
    if (filter) {
        filter.addEventListener('change', applyFilterAndRender);
    }
    // initHeatmap(); REMOVED to prevent index size error
});

let map, heatLayer, markersLayer;

function initHeatmap() {
    // Prevent double initialization
    if (map) {
        map.invalidateSize();
        return;
    }

    const mapContainer = document.getElementById('heatmap');
    if (!mapContainer || mapContainer.offsetWidth === 0) {
        console.warn("Map container hidden, skipping init.");
        return;
    }

    // Default Center (India)
    map = L.map('heatmap').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initial Empty Heat Layer
    heatLayer = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 17,
    }).addTo(map);

    // Marker Layer Group
    markersLayer = L.layerGroup().addTo(map);
}

function updateHeatmap(complaints) {
    if (!map || !heatLayer || !markersLayer) return;

    // 1. Update Heatmap
    const points = complaints
        .filter(c => c.coordinates && c.coordinates.lat && c.coordinates.lng)
        .map(c => [c.coordinates.lat, c.coordinates.lng, 1]); // 1 is intensity

    // Debounce Heatmap Update
    if (window.heatTimeout) clearTimeout(window.heatTimeout);
    window.heatTimeout = setTimeout(() => {
        heatLayer.setLatLngs(points);
        updateMarkers(complaints);
    }, 200);
}

function updateMarkers(complaints) {
    markersLayer.clearLayers();

    complaints.forEach(c => {
        if (c.coordinates && c.coordinates.lat && c.coordinates.lng && c.status !== 'Closed') {
            const marker = L.marker([c.coordinates.lat, c.coordinates.lng])
                .bindPopup(`
                    <b>${c.vehicleNo}</b><br>
                    ${c.vehicleType}<br>
                    <span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span>
                `);
            markersLayer.addLayer(marker);
        }
    });
}

// Render Complaints (Fetches Data)
function renderComplaints() {
    const list = document.getElementById('complaintsContainer');
    list.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Loading data...</p>';

    // Listen to ALL complaints in real-time
    db.collection("complaints").orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            allComplaints = snapshot.docs.map(doc => doc.data());

            // Only update heatmap if data changed significantly (simple debounce here)
            updateHeatmap(allComplaints);

            applyFilterAndRender();
        });
}

// Apply Filter and Render to DOM
function applyFilterAndRender() {
    const list = document.getElementById('complaintsContainer');
    const filter = document.getElementById('statusFilter');
    const statusCriteria = filter ? filter.value : 'All';

    // 1. Filter Data
    let filtered = allComplaints;
    if (statusCriteria !== 'All') {
        filtered = allComplaints.filter(c => c.status === statusCriteria);
    }

    // 2. Render
    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No complaints found for this status.</p>';
        return;
    }

    list.innerHTML = filtered.map(c => `
        <div class="complaint-card animate-in">
            <div class="complaint-header">
                <span class="complaint-id">${c.id}</span>
                <span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Type</strong>
                    ${c.vehicleType}
                </div>
                <div class="detail-item">
                    <strong>Vehicle No</strong>
                    ${c.vehicleNo}
                </div>
                <div class="detail-item">
                    <strong>Date</strong>
                    ${new Date(c.date).toLocaleString()}
                </div>
                <div class="detail-item">
                    <strong>Location</strong>
                    ${c.location} 
                    ${c.coordinates && c.coordinates.lat ? `<br><a href="https://www.google.com/maps?q=${c.coordinates.lat},${c.coordinates.lng}" target="_blank" style="color:var(--primary-color); font-size:0.8rem;">📍 View on Map</a>` : ''}
                </div>
                <div class="detail-item">
                    <strong>Owner</strong>
                    ${c.ownerName} (${c.contactInfo})
                </div>
            </div>

            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                ${c.vehicleImage ? `
                    <div style="flex:1;">
                        <strong style="display:block; margin-bottom:5px; font-size:0.8rem;">Vehicle Image</strong>
                        <img src="${c.vehicleImage.data}" style="max-height: 150px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); cursor: zoom-in;" onclick="openImagePreview(this.src)">
                        <br>
                        <a href="${c.vehicleImage.data}" download="${c.vehicleImage.name || 'vehicle_image.png'}" class="btn btn-secondary" style="font-size:0.8rem; padding: 5px 10px; margin-top:5px;">⬇️ Download</a>
                    </div>` : ''}
                ${c.rcDocument ? `
                    <div style="flex:1;">
                        <strong style="display:block; margin-bottom:5px; font-size:0.8rem;">RC Document</strong>
                        <img src="${c.rcDocument.data}" style="max-height: 150px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); cursor: zoom-in;" onclick="openImagePreview(this.src)">
                        <br>
                        <a href="${c.rcDocument.data}" download="${c.rcDocument.name || 'rc_document.png'}" class="btn btn-secondary" style="font-size:0.8rem; padding: 5px 10px; margin-top:5px;">⬇️ Download</a>
                    </div>` : ''}
            </div>

            <p style="color: var(--text-color); margin-bottom: 1rem; font-size: 0.95rem;">
                <strong>Description:</strong> ${c.description || 'N/A'}
            </p>

            <div class="actions">
                <select class="status-select" onchange="updateStatus('${c.id}', this.value)">
                    <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Investigating" ${c.status === 'Investigating' ? 'selected' : ''}>Investigating</option>
                    <option value="Found" ${c.status === 'Found' ? 'selected' : ''}>Found</option>
                    <option value="Closed" ${c.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
                <button class="btn btn-primary" onclick="openChat('${c.id}')">💬 Open Chat</button>
            </div>
        </div>
    `).join('');
}

async function updateStatus(id, newStatus) {
    const success = await updateComplaintStatus(id, newStatus);
    if (success) {
        // No need to alert or refresh, onSnapshot handles UI update
    } else {
        alert("Failed to update status");
    }
}

// Chat Listeners
let chatUnsubscribe = null;

function openChat(id) {
    const modal = document.getElementById('chatModal');
    openChatId = id;
    modal.style.display = 'block';

    // Subscribe to chat
    if (chatUnsubscribe) chatUnsubscribe(); // Unsubscribe prev

    chatUnsubscribe = db.collection("complaints").doc(id)
        .onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                renderAdminChat(data.messages || []);
            }
        });
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    openChatId = null;
    if (chatUnsubscribe) chatUnsubscribe();
}

function renderAdminChat(messages) {
    const history = document.getElementById('adminChatHistory');

    history.innerHTML = messages.map(msg => {
        let attachmentHtml = '';
        if (msg.attachment) {
            if (msg.attachment.type.startsWith('image/')) {
                attachmentHtml = `<div class="message-attachment"><img src="${msg.attachment.data}" onclick="openImagePreview(this.src)" style="cursor: zoom-in;"></div>`;
            } else {
                attachmentHtml = `<a href="${msg.attachment.data}" download="${msg.attachment.name}" class="file-attachment">📄 ${msg.attachment.name}</a>`;
            }
        }

        return `
            <div class="message ${msg.sender === 'Investigator' ? 'sent' : 'received'}">
                ${msg.text}
                ${attachmentHtml}
                <div class="message-meta">${msg.sender} • ${new Date(msg.timestamp).toLocaleString()}</div>
            </div>
        `;
    }).join('');
    history.scrollTop = history.scrollHeight;
}

async function handleAdminFile() {
    const fileInput = document.getElementById('adminFileInput');
    const file = fileInput.files[0];
    if (!file || !openChatId) return;

    if (file.size > 2000000) {
        alert('File is too large. Max 2MB allowed.');
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const attachment = {
            type: file.type,
            name: file.name,
            data: e.target.result
        };
        await addMessage(openChatId, 'Investigator', '', attachment);
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
}

async function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    const text = input.value.trim();

    if (!text || !openChatId) return;

    await addMessage(openChatId, 'Investigator', text);
    input.value = '';
}

// Image Preview Logic
function openImagePreview(src) {
    const modal = document.getElementById('imageModal');
    const fullImage = document.getElementById('fullImage');
    fullImage.src = src;
    modal.style.display = 'flex'; // Use flex to center
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// Make globally available for onclick="openImagePreview(this.src)" in HTML
window.openImagePreview = openImagePreview;
window.closeImageModal = closeImageModal;
