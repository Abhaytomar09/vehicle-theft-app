document.addEventListener('DOMContentLoaded', () => {
    // INITIALIZE EMAILJS
    try {
        emailjs.init(CONFIG.EMAILJS.publicKey);
    } catch (e) {
        console.error("EmailJS Init Failed:", e);
    }

    const form = document.getElementById('complaintForm');
    const successMsg = document.getElementById('successMessage');
    const displayId = document.getElementById('displayId');
    const newComplaintBtn = document.getElementById('newComplaintBtn');
    const theftDateInput = document.getElementById('theftDate');

    // Restrict Future Dates
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Local time adjust
    theftDateInput.max = now.toISOString().slice(0, 16);

    // Map Initialization
    const map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker;

    // Function to get location
    const locateUser = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const latlng = [latitude, longitude];

                map.setView(latlng, 15); // Zoom in

                if (marker) {
                    marker.setLatLng(latlng);
                } else {
                    marker = L.marker(latlng).addTo(map);
                }

                document.getElementById('lat').value = latitude;
                document.getElementById('lng').value = longitude;
                document.getElementById('theftLocation').value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }, (error) => {
                console.log("Geolocation validation error or denied: ", error);
                alert("Could not access your location. Please ensure location services are enabled.");
            });
        }
    };

    // Auto-detect on load
    locateUser();

    // Button Click
    document.getElementById('locateBtn').addEventListener('click', locateUser);

    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;

        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }

        document.getElementById('lat').value = lat;
        document.getElementById('lng').value = lng;

        // Simple reverse geocode simulation or just coords
        document.getElementById('theftLocation').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    });

    // --- AI OBJECT DETECTION LOGIC ---
    let aiModel = null;
    const aiStatus = document.createElement('div');
    aiStatus.style.marginTop = '10px';
    aiStatus.style.fontSize = '0.9rem';
    aiStatus.style.fontWeight = '600';
    document.getElementById('vehicleImg').parentNode.appendChild(aiStatus);

    // Load Model
    (async () => {
        try {
            aiStatus.innerHTML = '<span style="color:var(--text-muted)">🧠 Loading AI Model...</span>';
            aiModel = await cocoSsd.load();
            aiStatus.innerHTML = '<span style="color:var(--primary-color)">⚡ AI Ready</span>';
        } catch (e) {
            console.error("AI Load Failed:", e);
            aiStatus.innerHTML = '<span style="color:red">AI Offline</span>';
        }
    })();

    async function verifyVehicleContent(imgElement) {
        if (!aiModel) return;

        aiStatus.innerHTML = '🧠 AI Analyzing Image...';

        try {
            const predictions = await aiModel.detect(imgElement);
            console.log("AI Predictions:", predictions);

            const typeMap = {
                'Car': ['car', 'truck', 'bus'],
                'Bike': ['motorcycle', 'bicycle'],
                'Truck': ['truck', 'bus', 'car'],
                'Other': []
            };

            const selectedType = document.getElementById('vehicleType').value;
            const validClasses = typeMap[selectedType] || [];

            // Checks if ANY predicted class matches our expected types
            const match = predictions.find(p => validClasses.includes(p.class));

            if (match) {
                aiStatus.innerHTML = `✅ <strong>AI Verified:</strong> Detected a <span style="color:#00f2ff; text-transform:capitalize;">${match.class}</span> (${Math.round(match.score * 100)}% confidence)`;
                document.getElementById('vehicleImg').dataset.aiVerified = "true";
            } else {
                // If we found SOMETHING but not the right thing
                const topPrediction = predictions[0] ? predictions[0].class : "Nothing";
                aiStatus.innerHTML = `⚠️ <strong>AI Insight:</strong> looks like a '<strong>${topPrediction}</strong>'. (Expected: ${selectedType})`;
                // We don't block, just warn.
            }

        } catch (e) {
            console.error("Prediction Error", e);
            aiStatus.innerHTML = '⚠️ AI could not analyze.';
        }
    }

    // File Preview Logic
    const handleFileSelect = (input, previewId) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById(previewId);
                if (img) {
                    img.src = e.target.result;
                    img.style.display = 'block';

                    // Trigger AI Check when image is loaded
                    if (previewId === 'vehicleImgPreview') {
                        // Small delay to ensure render
                        setTimeout(() => verifyVehicleContent(img), 100);
                    }
                }
            }
            reader.readAsDataURL(input.files[0]);
        }
    };

    document.getElementById('vehicleImg').addEventListener('change', function () {
        handleFileSelect(this, 'vehicleImgPreview');
    });

    document.getElementById('rcDoc').addEventListener('change', function () {
        // RC Doc doesn't have a preview img element in the HTML by default based on previous context, 
        // but the code had a 'rcDocFeedback' element. 
        // We'll just leave this empty or add a preview if there was one.
        // Looking at the HTML (not visible here but recalled), only vehicleImg had a preview img.
        // Actually, let's just do nothing for RC doc if there is no preview element.
        // But for safety, let's keep it simple.

        // If we want to show filename like before:
        const fileNameDisplay = document.getElementById('rcDocName');
        if (fileNameDisplay && this.files[0]) {
            fileNameDisplay.textContent = this.files[0].name;
            fileNameDisplay.style.display = 'block';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Helper to read file
        const readFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                    name: file.name,
                    type: file.type,
                    data: reader.result
                });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        const vehicleImgFile = document.getElementById('vehicleImg').files[0];
        const rcDocFile = document.getElementById('rcDoc').files[0];
        const selectedDate = new Date(document.getElementById('theftDate').value);

        // Validate Date
        if (selectedDate > new Date()) {
            alert("Theft date cannot be in the future.");
            return;
        }



        // Ensure files are small (Firestore Doc limit is 1MB total)
        // Increased to 500KB to support PNGs better. 500KB * 1.33 = ~660KB.
        if (vehicleImgFile.size > 500000 || rcDocFile.size > 500000) {
            alert("File too large! 📂\n\nYour image is over 500KB. PNGs can be heavy.\n\nPlease compress it or use a JPG.");
            return;
        }

        const vehicleImgData = await readFile(vehicleImgFile);
        const rcDocData = await readFile(rcDocFile);

        // Gather data
        const email = document.getElementById('ownerEmail').value;
        const phone = document.getElementById('ownerPhone').value;
        const lat = document.getElementById('lat').value;
        const lng = document.getElementById('lng').value;

        const complaint = {
            id: generateId(),
            ownerName: document.getElementById('ownerName').value,
            contactInfo: `${email} | ${phone}`,
            email: email,
            phone: phone,
            vehicleType: document.getElementById('vehicleType').value,
            vehicleNo: document.getElementById('vehicleNo').value,
            location: document.getElementById('theftLocation').value,
            coordinates: { lat, lng },
            vehicleImage: vehicleImgData,
            rcDocument: rcDocData,
            date: document.getElementById('theftDate').value,
            description: document.getElementById('description').value,
            status: 'Pending',
            messages: [], // Initialize empty array for chat
            timestamp: new Date().toISOString()
        };

        try {
            // Save to Firebase (ASYNC)
            await saveComplaint(complaint);

            // ---------------------------------------------------------
            // OPTIMIZATION: Show Success IMMEDIATELY (Don't wait for Email)
            // ---------------------------------------------------------
            form.style.display = 'none';
            successMsg.style.display = 'block';
            displayId.textContent = complaint.id;

            // Only update the button state to indicate background work if they stay
            const originalText = document.querySelector('button[type="submit"]').textContent;
            const submitBtn = document.querySelector('button[type="submit"]');

            // Send Email via EmailJS (Background Process)
            // PREPARE EMAIL PARAMS
            const templateParams = {
                to_name: document.getElementById('ownerName').value,
                to_email: email,
                complaint_id: complaint.id,
                vehicle_no: document.getElementById('vehicleNo').value,
                status_link: window.location.href.replace('victim.html', 'status.html'),
            };

            // Don't 'await' this. Let it run.
            emailjs.send('service_047defp', 'template_6koxx0f', templateParams)
                .then(function () {
                    const note = document.createElement('p');
                    note.style.color = 'var(--primary-color)';
                    note.style.marginTop = '10px';
                    note.innerHTML = `✅ Confirmation Email sent to <strong>${email}</strong>`;
                    successMsg.appendChild(note);
                }, function (error) {
                    console.error('EmailJS Error:', error);
                    // Silently fail or minimal log since user is already happy with ID
                    let verifyMsg = "Email blocked/failed.";
                    if (window.navigator && !window.navigator.onLine) verifyMsg = "No internet.";

                    const note = document.createElement('p');
                    note.style.color = 'var(--secondary-color)';
                    note.style.marginTop = '10px';
                    note.innerHTML = `⚠️ Email notification failed (${verifyMsg})`;
                    successMsg.appendChild(note);
                });

        } catch (dbError) {
            console.error("Database Save Failed:", dbError);
            alert("Critical Error: Failed to save complaint to database.\n" + dbError.message);
            return;
        }
    });

    newComplaintBtn.addEventListener('click', () => {
        form.reset();
        successMsg.style.display = 'none';
        form.style.display = 'block';
    });
});
