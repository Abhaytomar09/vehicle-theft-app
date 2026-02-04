document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const resultContainer = document.getElementById('resultContainer');
    const errorMsg = document.getElementById('errorMsg');

    // Elements to update
    const resVehicle = document.getElementById('resVehicle');
    const resStatus = document.getElementById('resStatus');
    const flowTracker = document.getElementById('flowTracker');

    // Chat Elements
    const chatHistory = document.getElementById('chatHistory');
    const chatInput = document.getElementById('chatInput');
    const sendMsgBtn = document.getElementById('sendMsgBtn');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('chatFileInput');
    let currentComplaintId = null;

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Perform Search
    async function performSearch() {
        const id = searchInput.value.trim();
        if (!id) return;

        // Reset UI
        errorMsg.style.display = 'none';
        resultContainer.style.display = 'none';

        // Listen to document changes in Real-time
        // Unsubscribe from previous listener if exists
        if (window.currentListener) {
            window.currentListener();
        }

        window.currentListener = db.collection("complaints").doc(id)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const complaint = doc.data();
                    currentComplaintId = complaint.id;

                    // Update UI
                    resultContainer.style.display = 'block';
                    document.getElementById('resVehicle').innerText = `${complaint.vehicleType} - ${complaint.vehicleNo}`;

                    const statusText = document.getElementById('resStatus');
                    statusText.innerText = `Status: ${complaint.status}`;
                    statusText.className = getStatusClass(complaint.status);

                    updateFlowTracker(complaint.status);
                    renderChat(complaint.messages || []);
                } else {
                    errorMsg.style.display = 'block';
                    resultContainer.style.display = 'none';
                }
            });
    }

    function getStatusClass(status) {
        if (status === 'Investigating') return 'text-warning';
        if (status === 'Found') return 'text-success';
        if (status === 'Closed') return 'text-muted';
        return 'text-danger'; // Pending
    }

    function updateFlowTracker(currentStatus) {
        const steps = ['Pending', 'Investigating', 'Found', 'Closed'];
        const icons = ['📝', '🕵️', '✅', '🔒'];
        const descriptions = ['Complaint Received', 'Officer Assigned', 'Vehicle Recovered', 'Case Closed'];

        let currentIndex = steps.indexOf(currentStatus);

        flowTracker.innerHTML = steps.map((step, index) => {
            let className = 'status-step';
            if (index <= currentIndex) className += ' active';
            if (index < currentIndex) className += ' complete';

            return `
                <div class="${className}">
                    <div class="step-icon">${icons[index]}</div>
                    <div class="step-info">
                        <h4>${step}</h4>
                        <p>${descriptions[index]}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Chat Logic
    function renderChat(messages) {
        chatHistory.innerHTML = messages.map(msg => {
            let attachmentHtml = '';
            if (msg.attachment) {
                if (msg.attachment.type.startsWith('image/')) {
                    attachmentHtml = `<div class="message-attachment"><img src="${msg.attachment.data}" onclick="window.open(this.src)"></div>`;
                } else {
                    attachmentHtml = `<a href="${msg.attachment.data}" download="${msg.attachment.name}" class="file-attachment">📄 ${msg.attachment.name}</a>`;
                }
            }

            return `
                <div class="message ${msg.sender === 'User' ? 'sent' : 'received'}">
                    ${msg.text}
                    ${attachmentHtml}
                    <div class="message-meta">${formatDate(msg.timestamp)}</div>
                </div>
            `;
        }).join('');
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Attach Button Click
    attachBtn.addEventListener('click', () => fileInput.click());

    // File Selection
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 2000000) { // 2MB limit for LocalStorage safety
            alert('File is too large. Max 2MB allowed.');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const attachment = {
                type: file.type,
                name: file.name,
                data: e.target.result
            };
            addMessage(currentComplaintId, 'User', '', attachment);
            // renderChat handled by onSnapshot
            fileInput.value = '';
        };
        reader.readAsDataURL(file);
    });

    sendMsgBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !currentComplaintId) return;

        await addMessage(currentComplaintId, 'User', text);
        chatInput.value = '';
        // renderChat handled by onSnapshot
    }

    // Auto-refresh removed - replaced by onSnapshot
});
