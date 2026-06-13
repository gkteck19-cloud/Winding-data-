// Array to store temporal Base64 photos
let uploadedPhotos = [];

// DOM Elements
const diaryForm = document.getElementById('diaryForm');
const photoUpload = document.getElementById('photoUpload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const calcBtn = document.getElementById('calcBtn');
const recordsList = document.getElementById('recordsList');
const searchBar = document.getElementById('searchBar');

// 1. AUTOMATIC WIRE WEIGHT CALCULATOR LOGIC
// Standard copper density formula basis for standard 4-pole/2-pole estimation
calcBtn.addEventListener('click', () => {
    const slots = parseFloat(document.getElementById('slots').value) || 0;
    const length = parseFloat(document.getElementById('coreLength').value) || 0;
    const dia = parseFloat(document.getElementById('innerDia').value) || 0;

    if(length > 0 && dia > 0) {
        // Standard thumb rule formula for estimation: (Dia * Length * Slots) / Constant Factor
        // Yeh ek practical approximation deta hai grams mein.
        let estimatedWeight = Math.round((dia * length * slots) / 95);
        document.getElementById('calcWeight').innerText = estimatedWeight;
    } else {
        alert("कृपया कोर की लम्बाई और अंदर का व्यास सही भरें!");
    }
});

// 2. MULTIPLE PHOTO UPLOAD (MAX 5) WITH PREVIEW
photoUpload.addEventListener('change', (e) => {
    imagePreviewContainer.innerHTML = "";
    uploadedPhotos = [];
    const files = Array.from(e.target.files).slice(0, 5); // Max 5 picks

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedPhotos.push(event.target.result); // Save Base64 string
            
            // Create preview thumbnail
            const img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('preview-img');
            imagePreviewContainer.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
});

// 3. SAVE TO LOCALSTORAGE DIARY
diaryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newRecord = {
        id: Date.now(),
        name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        motor: document.getElementById('motorType').value,
        swg: document.getElementById('wireSwg').value,
        weight: document.getElementById('calcWeight').innerText,
        photos: uploadedPhotos
    };

    let savedRecords = JSON.parse(localStorage.getItem('motorDiary')) || [];
    savedRecords.push(newRecord);
    localStorage.setItem('motorDiary', JSON.stringify(savedRecords));

    alert("रिकॉर्ड डायरी में सुरक्षित कर दिया गया है!");
    diaryForm.reset();
    imagePreviewContainer.innerHTML = "";
    document.getElementById('calcWeight').innerText = "0";
    uploadedPhotos = [];
    
    loadRecords();
});

// 4. LOAD & DISPLAY RECORDS
function loadRecords(filter = "") {
    recordsList.innerHTML = "";
    let savedRecords = JSON.parse(localStorage.getItem('motorDiary')) || [];

    savedRecords.forEach(record => {
        // Search Filter Logic
        if(record.name.toLowerCase().includes(filter.toLowerCase()) || record.mobile.includes(filter)) {
            
            const card = document.createElement('div');
            card.classList.add('card');

            // Photo rendering loop
            let photoHTML = '';
            record.photos.forEach(p => {
                photoHTML += `<img src="${p}" alt="Motor Photo">`;
            });

            card.innerHTML = `
                <h3>👤 ${record.name} (मो: ${record.mobile})</h3>
                <button class="btn-delete" onclick="deleteRecord(${record.id})">हटाएं</button>
                <p>⚙️ <strong>मोटर टाइप:</strong> ${record.motor}</p>
                <p>📏 <strong>वायर गेज (SWG):</strong> ${record.swg || 'N/A'}</p>
                <p>⚖️ <strong>अनुमानित वायर वज़न:</strong> ${record.weight} ग्राम</p>
                <div class="card-photos">${photoHTML}</div>
            `;
            recordsList.appendChild(card);
        }
    });
}

// 5. DELETE RECORD
window.deleteRecord = function(id) {
    if(confirm("क्या आप वाकई यह रिकॉर्ड डिलीट करना चाहते हैं?")) {
        let savedRecords = JSON.parse(localStorage.getItem('motorDiary')) || [];
        savedRecords = savedRecords.filter(r => r.id !== id);
        localStorage.setItem('motorDiary', JSON.stringify(savedRecords));
        loadRecords();
    }
}

// Search interaction
searchBar.addEventListener('input', (e) => {
    loadRecords(e.target.value);
});

// Run on page load
loadRecords();
      
