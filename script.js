let tempPhotos = [];

// TAB SWITCHING FUNCTION
window.switchTab = function(tabId, btn) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.remove('active'));
    
    // Show target content and active target button
    document.getElementById(tabId).classList.add('active-content');
    btn.classList.add('active');
}

// 1. WIRE EXPENSE AUTOMATIC CALCULATOR
document.getElementById('calcBtn').addEventListener('click', () => {
    const slots = parseFloat(document.getElementById('slots').value) || 0;
    const length = parseFloat(document.getElementById('coreLength').value) || 0;
    const dia = parseFloat(document.getElementById('innerDia').value) || 0;

    if (length > 0 && dia > 0) {
        // Practical standard workshop copper winding thumb rule formula
        let estimatedWeight = Math.round((dia * length * slots) / 95);
        document.getElementById('calcWeight').value = estimatedWeight;
    } else {
        alert("कृपया कैलकुलेटर में कोर की लम्बाई और अंदर का व्यास भरें!");
    }
});

// 2. IMAGE UPLOAD PREVIEW HANDLING (MAX 5)
document.getElementById('photoUpload').addEventListener('change', (e) => {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = "";
    tempPhotos = [];
    const files = Array.from(e.target.files).slice(0, 5);

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            tempPhotos.push(event.target.result);
            const img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('preview-img');
            container.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
});

// ================= CUSTOMER STORAGE MANAGEMENT =================
document.getElementById('customerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newCustomer = {
        id: Date.now(),
        name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        address: document.getElementById('custAddress').value,
        motor: document.getElementById('custMotorModel').value
    };

    let customers = JSON.parse(localStorage.getItem('workshopCustomers')) || [];
    customers.push(newCustomer);
    localStorage.setItem('workshopCustomers', JSON.stringify(customers));

    alert("कस्टमर का रिकॉर्ड सफलतापूर्वक सेव हो गया!");
    document.getElementById('customerForm').reset();
    loadCustomers();
});

function loadCustomers(filter = "") {
    const list = document.getElementById('customerList');
    list.innerHTML = "";
    let customers = JSON.parse(localStorage.getItem('workshopCustomers')) || [];

    customers.forEach(c => {
        if (c.name.toLowerCase().includes(filter.toLowerCase()) || c.mobile.includes(filter)) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3>👤 ${c.name}</h3>
                <button class="btn-delete" onclick="deleteCustomer(${c.id})">हटाएं</button>
                <p>📞 <strong>मोबाइल:</strong> ${c.mobile}</p>
                <p>📍 <strong>पता:</strong> ${c.address || 'N/A'}</p>
                <p>📦 <strong>मोटर मॉडल:</strong> ${c.motor || 'N/A'}</p>
            `;
            list.appendChild(card);
        }
    });
}

window.deleteCustomer = function(id) {
    if(confirm("क्या आप इस कस्टमर का रिकॉर्ड डिलीट करना चाहते हैं?")) {
        let customers = JSON.parse(localStorage.getItem('workshopCustomers')) || [];
        customers = customers.filter(c => c.id !== id);
        localStorage.setItem('workshopCustomers', JSON.stringify(customers));
        loadCustomers();
    }
}

// ================= WINDING DATA STORAGE MANAGEMENT =================
document.getElementById('windingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newWinding = {
        id: Date.now(),
        motorName: document.getElementById('windMotorName').value,
        swg: document.getElementById('windSwg').value,
        turns: document.getElementById('windTurns').value,
        pitch: document.getElementById('windPitch').value,
        weight: document.getElementById('calcWeight').value,
        photos: tempPhotos
    };

    let windingDb = JSON.parse(localStorage.getItem('workshopWindingDb')) || [];
    windingDb.push(newWinding);
    localStorage.setItem('workshopWindingDb', JSON.stringify(windingDb));

    alert("वाइंडिंग डेटा मास्टर डेटाबेस में सुरक्षित हो गया!");
    document.getElementById('windingForm').reset();
    document.getElementById('imagePreviewContainer').innerHTML = "";
    document.getElementById('calcWeight').value = "0";
    tempPhotos = [];
    loadWindingData();
});

function loadWindingData(filter = "") {
    const list = document.getElementById('windingDataList');
    list.innerHTML = "";
    let windingDb = JSON.parse(localStorage.getItem('workshopWindingDb')) || [];

    windingDb.forEach(w => {
        if (w.motorName.toLowerCase().includes(filter.toLowerCase())) {
            const card = document.createElement('div');
            card.classList.add('card');
            
            let photoHTML = '';
            w.photos.forEach(p => { photoHTML += `<img src="${p}">`; });

            card.innerHTML = `
                <h3>⚙️ ${w.motorName}</h3>
                <button class="btn-delete" onclick="deleteWinding(${w.id})">हटाएं</button>
                <p>📏 <strong>वायर साइज (SWG):</strong> ${w.swg || 'N/A'}</p>
                <p>🔄 <strong>टर्न्स (Turns):</strong> ${w.turns || 'N/A'}</p>
                <p>📐 <strong>पिच (Pitch):</strong> ${w.pitch || 'N/A'}</p>
                <p>⚖️ <strong>अनुमानित वज़न:</strong> ${w.weight} ग्राम</p>
                <div class="card-photos">${photoHTML}</div>
            `;
            list.appendChild(card);
        }
    });
}

window.deleteWinding = function(id) {
    if(confirm("क्या आप इस वाइंडिंग डेटा को डिलीट करना चाहते हैं?")) {
        let windingDb = JSON.parse(localStorage.getItem('workshopWindingDb')) || [];
        windingDb = windingDb.filter(w => w.id !== id);
        localStorage.setItem('workshopWindingDb', JSON.stringify(windingDb));
        loadWindingData();
    }
}

// Initial Load
loadCustomers();
loadWindingData();

// ऐप लोड होने के बाद स्प्लैश स्क्रीन हटाने का टाइमर लॉजिक
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    
    // 2 सेकंड (2000ms) तक स्प्लैश स्क्रीन होल्ड रहेगी
    setTimeout(() => {
        splash.classList.add('fade-out');
        
        // फ़ेड-आउट एनिमेशन खत्म होने के बाद स्क्रीन को पूरी तरह छुपाना
        setTimeout(() => {
            splash.classList.add('hidden');
        }, 800);
    }, 2000); 
});
