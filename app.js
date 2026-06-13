let db;
let currentTab = "motors";

// एक बिलकुल नया डेटाबेस ताकि पुराने क्रैश वाले डेटा से परेशानी न हो
const request = indexedDB.open("MaaBhagwatiFinalStore", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("motors")) {
        db.createObjectStore("motors", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => { 
    db = e.target.result; 
    renderCurrentTab(); 
};

function switchTab(tabName) {
    currentTab = tabName;
    const mBtn = document.getElementById("tabMotorsBtn");
    const cBtn = document.getElementById("tabCustomersBtn");
    
    if(tabName === "motors") {
        mBtn.className = "flex-grow py-2.5 rounded-lg text-sm font-bold bg-orange-500 text-white transition";
        cBtn.className = "flex-grow py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition";
        document.getElementById("searchInput").placeholder = "सर्च मोटर (नाम या कंपनी से)...";
    } else {
        cBtn.className = "flex-grow py-2.5 rounded-lg text-sm font-bold bg-orange-500 text-white transition";
        mBtn.className = "flex-grow py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition";
        document.getElementById("searchInput").placeholder = "सर्च ग्राहक (नाम, मोबाइल या मोटर)...";
        updateMotorDropdown();
    }
    renderCurrentTab();
}

function renderCurrentTab() {
    if(currentTab === "motors") loadMotors();
    else loadCustomers();
}

function openCurrentForm() {
    if(currentTab === "motors") {
        document.getElementById('motorForm').reset();
        document.getElementById('motorEditId').value = "";
        document.getElementById('motorModalTitle').innerText = "नया मोटर डेटा जोड़ें";
        document.getElementById('motorSaveButton').innerText = "मोटर सेव करें";
        document.getElementById('motorModal').classList.remove('hidden');
    } else {
        document.getElementById('customerForm').reset();
        document.getElementById('customerEditId').value = "";
        document.getElementById('cJobDate').valueAsDate = new Date();
        document.getElementById('customerModalTitle').innerText = "नया ग्राहक रिकॉर्ड जोड़ें";
        document.getElementById('customerSaveButton').innerText = "रिकॉर्ड सेव करें";
        updateMotorDropdown();
        document.getElementById('customerModal').classList.remove('hidden');
    }
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function updateMotorDropdown() {
    const select = document.getElementById("cMotorSelect");
    select.innerHTML = '<option value="">-- मोटर चुनें (डायरी से) --</option>';
    
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const list = e.target.result;
        list.forEach(m => {
            select.innerHTML += `<option value="${m.id}" data-weight="${m.totalWeight || 0}">${m.name} ${m.company ? `(${m.company})` : ''}</option>`;
        });
    };
}

function autoFillWeight() {
    const select = document.getElementById("cMotorSelect");
    const selectedOption = select.options[select.selectedIndex];
    if(selectedOption && selectedOption.value !== "") {
        document.getElementById("cMotorWeight").value = selectedOption.getAttribute("data-weight");
        document.getElementById("cMotorCustom").value = selectedOption.text;
    }
}

// ================= MOTOR LOGIC =================
function checkMotorDuplicate(name, company) {
    return new Promise((resolve) => {
        let isDuplicate = false;
        db.transaction("motors").objectStore("motors").openCursor().onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.name.trim().toUpperCase() === name.trim().toUpperCase() && 
                    (cursor.value.company || "").trim().toUpperCase() === company.trim().toUpperCase()) {
                    isDuplicate = true;
                    resolve(true);
                    return;
                }
                cursor.continue();
            } else { resolve(isDuplicate); }
        };
    });
}

document.getElementById('motorForm').onsubmit = async (e) => {
    e.preventDefault();
    const files = document.getElementById('photoInput').files;
    const editId = document.getElementById('motorEditId').value;
    const mName = document.getElementById('motorName').value;
    const cName = document.getElementById('companyName').value;

    if (!editId && await checkMotorDuplicate(mName, cName)) {
        alert("❌ यह मोटर डायरी में पहले से सेव्ड है!");
        return;
    }
    
    let picsArray = [];
    if(files.length > 0) {
        const maxFiles = Math.min(files.length, 5);
        for(let i=0; i<maxFiles; i++) {
            let base64 = await new Promise(r => {
                const reader = new FileReader();
                reader.onload = () => r(reader.result);
                reader.readAsDataURL(files[i]);
            });
            picsArray.push(base64);
        }
    }

    const motorData = {
        name: mName, company: cName,
        stamping: document.getElementById('stamping').value,
        idSize: document.getElementById('idSize').value,
        odSize: document.getElementById('odSize').value,
        slots: document.getElementById('slots').value,
        wireType: document.getElementById('wireType').value,
        totalWeight: parseFloat(document.getElementById('totalWeight').value) || 0,
        paperSize: document.getElementById('paperSize').value,
        connection: document.getElementById('connection').value,
        condenser: document.getElementById('condenser').value,
        running: { guage: document.getElementById('rGuage').value, pitch: document.getElementById('rPitch').value, round: document.getElementById('rRound').value, turns: document.getElementById('rTurns').value, length: document.getElementById('rLength').value, weight: document.getElementById('rWeight').value },
        starting: { guage: document.getElementById('sGuage').value, pitch: document.getElementById('sPitch').value, round: document.getElementById('sRound').value, turns: document.getElementById('sTurns').value, length: document.getElementById('sLength').value, weight: document.getElementById('sWeight').value }
    };

    const tx = db.transaction("motors", "readwrite");
    if(editId) {
        motorData.id = parseInt(editId);
        tx.objectStore("motors").get(motorData.id).onsuccess = (ev) => {
            motorData.pics = picsArray.length > 0 ? picsArray : (ev.target.result.pics || []);
            tx.objectStore("motors").put(motorData);
        };
    } else {
        motorData.pics = picsArray;
        tx.objectStore("motors").add(motorData);
    }
    tx.oncomplete = () => { closeModal('motorModal'); loadMotors(); };
};

function loadMotors() {
    const list = document.getElementById('dataList');
    list.innerHTML = "";
    db.transaction("motors").objectStore("motors").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-md flex justify-between items-center" onclick="showMotorDetails(${m.id})">
                    <div>
                        <h3 class="data-title font-bold text-orange-400 uppercase text-lg">${m.name} ${m.company ? `(${m.company})` : ''}</h3>
                        <p class="text-xs text-slate-400 italic">स्लॉट: ${m.slots || '-'} | वायर: ${m.wireType || '-'} | वजन: ${m.totalWeight || 0}g</p>
                    </div>
                    <span class="text-slate-600 text-2xl">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showMotorDetails(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        let imgHTML = "";
        if(m.pics && m.pics.length > 0) {
            imgHTML = `<div class="flex gap-2 overflow-x-auto p-4 bg-slate-900/50">`;
            m.pics.forEach(p => imgHTML += `<img src="${p}" class="bg-pic-slider" style="width:calc(100%/${m.pics.length > 1 ? '1.2' : '1'});flex-shrink:0;">`);
            imgHTML += `</div>`;
        }
        details.innerHTML = `
            <div class="content-overlay">
                <button onclick="closeModal('detailsModal')" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-2xl font-bold text-orange-500 uppercase mt-2">${m.name}</h2>
                <p class="text-xs text-slate-400 font-semibold border-b border-slate-700 pb-2 mb-3">कंपनी: ${m.company || '-'}</p>
                ${imgHTML}
                <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div class="bg-slate-700/50 p-2 rounded-lg"><span class="text-slate-400 block">Stator Core:</span><b>${m.stamping || '-'}</b></div>
                    <div class="bg-slate-700/50 p-2 rounded-lg"><span class="text-slate-400 block">ID / OD:</span><b>${m.idSize || '-'} / ${m.odSize || '-'}</b></div>
                    <div class="bg-slate-700/50 p-2 rounded-lg"><span class="text-slate-400 block">Slots / Wire:</span><b>${m.slots || '-'} / ${m.wireType || '-'}</b></div>
                    <div class="bg-slate-700/50 p-2 rounded-lg"><span class="text-slate-400 block">कुल वायर वजन:</span><b>${m.totalWeight || 0}g</b></div>
                </div>
                <div class="bg-blue-600/10 p-3 rounded-xl border border-blue-400/20 text-xs mb-3">
                    <p class="font-bold text-blue-400 mb-1 uppercase text-[10px]">Running Coil</p>
                    <div class="grid grid-cols-3 gap-1">
                        <span>G: ${m.running.guage}</span><span>P: ${m.running.pitch}</span><span>R: ${m.running.round}</span>
                        <span>T: ${m.running.turns}</span><span>L: ${m.running.length}</span><span>W: ${m.running.weight}g</span>
                    </div>
                </div>
                <div class="bg-green-600/10 p-3 rounded-xl border border-green-400/20 text-xs mb-3">
                    <p class="font-bold text-green-400 mb-1 uppercase text-[10px]">Starting Coil</p>
                    <div class="grid grid-cols-3 gap-1">
                        <span>G: ${m.starting.guage}</span><span>P: ${m.starting.pitch}</span><span>R: ${m.starting.round}</span>
                        <span>T: ${m.starting.turns}</span><span>L: ${m.starting.length}</span><span>W: ${m.starting.weight}g</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-4">
                    <button onclick="editMotorData(${m.id})" class="bg-blue-600 text-white font-bold py-2 rounded-lg text-sm">सुधारें</button>
                    <button onclick="deleteData('motors', ${m.id})" class="bg-red-500/80 text-white font-bold py-2 rounded-lg text-sm">डिलीट</button>
                </div>
            </div>`;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function editMotorData(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        document.getElementById('motorEditId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('companyName').value = m.company || "";
        document.getElementById('stamping').value = m.stamping || "";
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('odSize').value = m.odSize || "";
        document.getElementById('slots').value = m.slots || "";
        document.getElementById('wireType').value = m.wireType || "Copper";
        document.getElementById('totalWeight').value = m.totalWeight || "";
        document.getElementById('paperSize').value = m.paperSize || "";
        document.getElementById('connection').value = m.connection || "";
        document.getElementById('condenser').value = m.condenser || "";
        document.getElementById('rGuage').value = m.running.guage;
        document.getElementById('rPitch').value = m.running.pitch;
        document.getElementById('rRound').value = m.running.round;
        document.getElementById('rTurns').value = m.running.turns;
        document.getElementById('rWeight').value = m.running.weight;
        document.getElementById('rLength').value = m.running.length;
        document.getElementById('sGuage').value = m.starting.guage;
        document.getElementById('sPitch').value = m.starting.pitch;
        document.getElementById('sRound').value = m.starting.round;
        document.getElementById('sTurns').value = m.starting.turns;
        document.getElementById('sWeight').value = m.starting.weight;
        document.getElementById('sLength').value = m.starting.length;
        
        document.getElementById('motorModalTitle').innerText = "मोटर डेटा सुधारें";
        document.getElementById('motorSaveButton').innerText = "अपडेट करें";
        closeModal('detailsModal');
        document.getElementById('motorModal').classList.remove('hidden');
    };
}

// ================= CUSTOMER LOGIC =================
document.getElementById('customerForm').onsubmit = (e) => {
    e.preventDefault();
    const editId = document.getElementById('customerEditId').value;
    
    const customerData = {
        customerName: document.getElementById('cName').value,
        customerMobile: document.getElementById('cMobile').value,
        jobDate: document.getElementById('cJobDate').value,
        motorTitle: document.getElementById('cMotorCustom').value || "Unknown Motor",
        totalWeight: parseFloat(document.getElementById('cMotorWeight').value) || 0,
        totalCharge: parseFloat(document.getElementById('cTotalCharge').value) || 0,
        advancePaid: parseFloat(document.getElementById('cAdvancePaid').value) || 0,
        faultNote: document.getElementById('cFaultNote').value
    };

    const tx = db.transaction("customers", "readwrite");
    if(editId) {
        customerData.id = parseInt(editId);
        tx.objectStore("customers").put(customerData);
    } else {
        tx.objectStore("customers").add(customerData);
    }
    tx.oncomplete = () => { closeModal('customerModal'); loadCustomers(); };
};

function loadCustomers() {
    const list = document.getElementById('dataList');
    list.innerHTML = "";
    db.transaction("customers").objectStore("customers").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const c = cursor.value;
            const balance = (c.totalCharge || 0) - (c.advancePaid || 0);
            const balText = balance > 0 ? `<span class="text-red-400 font-bold ml-2">बकाया: ₹${balance}</span>` : `<span class="text-green-400 font-bold ml-2">क्लियर</span>`;
            
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-md flex justify-between items-center border-l-green-500" onclick="showCustomerDetails(${c.id})">
                    <div class="w-full">
                        <div class="flex justify-between items-start">
                            <h3 class="data-title font-bold text-green-400 text-lg">${c.customerName}</h3>
                            <span class="text-[11px] text-slate-500 font-mono">${c.jobDate}</span>
                        </div>
                        <p class="text-xs text-slate-300">मोटर: <b>${c.motorTitle}</b> | ${balText}</p>
                    </div>
                    <span class="text-slate-600 text-2xl">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showCustomerDetails(id) {
    db.transaction("customers").objectStore("customers").get(id).onsuccess = (e) => {
        const c = e.target.result;
        const details = document.getElementById('detailsContent');
        const rate = parseFloat(document.getElementById('wireRateInput').value) || 0;
        const wireCost = Math.round((c.totalWeight / 1000) * rate);
        const balance = c.totalCharge - c.advancePaid;

        let noteHTML = "";
        if(c.faultNote) {
            noteHTML = `<div class="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-xs"><span class="text-red-400 font-bold block">फॉल्ट नोट:</span><p class="italic">` + c.faultNote + `</p></div>`;
        }

        details.innerHTML = `
            <div class="content-overlay">
                <button onclick="closeModal('detailsModal')" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-2xl font-bold text-green-400 mt-2">${c.customerName}</h2>
                <p class="text-xs text-slate-400 font-semibold border-b border-slate-700 pb-2 mb-4">मोबाइल: ${c.customerMobile || '-'} | दिनांक: ${c.jobDate}</p>
                <div class="space-y-3 text-sm">
                    <p class="text-slate-300">लायी गयी मोटर: <b class="text-white text-base">${c.motorTitle}</b></p>
                    <div class="grid grid-cols-2 gap-2 bg-slate-900/50 p-3 rounded-xl text-xs">
                        <div>कुल चार्ज: <b class="text-green-400 text-sm block">₹${c.totalCharge}</b></div>
                        <div>जमा एडवांस: <b class="text-blue-400 text-sm block">₹${c.advancePaid}</b></div>
                        <div>बकाया राशि: <b class="${balance > 0 ? 'text-red-400' : 'text-green-400'} text-sm block">₹${balance}</b></div>
                        <div>तार का वजन / लागत: <b class="text-orange-400 text-sm block">${c.totalWeight}g (₹${wireCost})</b></div>
                    </div>
                    ${noteHTML}
                </div>
                <div class="grid grid-cols-2 gap-2 mt-6">
                    <button onclick="editCustomerData(${c.id})" class="bg-blue-600 text-white font-bold py-2 rounded-lg text-sm">सुधारें</button>
                    <button onclick="deleteData('customers', ${c.id})" class="bg-red-500/80 text-white font-bold py-2 rounded-lg text-sm">डिलीट</button>
                </div>
            </div>`;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function editCustomerData(id) {
    db.transaction("customers").objectStore("customers").get(id).onsuccess = (e) => {
        const c = e.target.result;
        document.getElementById('customerEditId').value = c.id;
        document.getElementById('cName').value = c.customerName;
        document.getElementById('cMobile').value = c.customerMobile || "";
        document.getElementById('cJobDate').value = c.jobDate;
        document.getElementById('cMotorCustom').value = c.motorTitle;
        document.getElementById('cMotorWeight').value = c.totalWeight || "";
        document.getElementById('cTotalCharge').value = c.totalCharge || "";
        document.getElementById('cAdvancePaid').value = c.advancePaid || "";
        document.getElementById('cFaultNote').value = c.faultNote || "";
        
        document.getElementById('customerModalTitle').innerText = "ग्राहक रिकॉर्ड सुधारें";
        document.getElementById('customerSaveButton').innerText = "अपडेट करें";
        closeModal('detailsModal');
        updateMotorDropdown();
        document.getElementById('customerModal').classList.remove('hidden');
    };
}

// ================= GLOBAL TOOLS =================
function deleteData(storeName, id) {
    if(confirm("क्या आप वाकई इसे हटाना चाहते हैं?")) {
        db.transaction(storeName, "readwrite").objectStore(storeName).delete(id).onsuccess = () => {
            closeModal('detailsModal');
            renderCurrentTab();
        };
    }
}

function searchData() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.querySelector('.data-titl                    return;
                }
                cursor.continue();
            } else {
                resolve(isDuplicate);
            }
        };
    });
}

document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    const files = document.getElementById('photoInput').files;
    const editId = document.getElementById('editId').value;
    
    const mName = document.getElementById('motorName').value;
    const cName = document.getElementById('companyName').value;

    // अगर नया डेटा जोड़ रहे हैं, तो डुप्लीकेट चेक करेगा
    if (!editId) {
        const isDuplicate = await checkDuplicate(mName, cName);
        if (isDuplicate) {
            alert(`❌ रिकॉर्ड पहले से मौजूद है!\nइस कंपनी (${cName || 'No Company'}) और नाम (${mName}) की मोटर पहले से सेव्ड है।`);
            return;
        }
    }
    
    let picsArray = [];
    if(files.length > 0) {
        const maxFiles = Math.min(files.length, 5);
        for(let i=0; i<maxFiles; i++) {
            let base64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(files[i]);
            });
            picsArray.push(base64);
        }
    }

    const motorData = {
        name: mName,
        company: cName,
        stamping: document.getElementById('stamping').value,
        idSize: document.getElementById('idSize').value,
        odSize: document.getElementById('odSize').value,
        slots: document.getElementById('slots').value,
        wireType: document.getElementById('wireType').value,
        totalWeight: document.getElementById('totalWeight').value,
        paperSize: document.getElementById('paperSize').value,
        connection: document.getElementById('connection').value,
        condenser: document.getElementById('condenser').value,
        running: { 
            guage: document.getElementById('rGuage').value,
            pitch: document.getElementById('rPitch').value,
            round: document.getElementById('rRound').value,
            turns: document.getElementById('rTurns').value, 
            length: document.getElementById('rLength').value, 
            weight: document.getElementById('rWeight').value 
        },
        starting: { 
            guage: document.getElementById('sGuage').value,
            pitch: document.getElementById('sPitch').value,
            round: document.getElementById('sRound').value,
            turns: document.getElementById('sTurns').value, 
            length: document.getElementById('sLength').value, 
            weight: document.getElementById('sWeight').value 
        }
    };

    const tx = db.transaction("motors", "readwrite");
    const store = tx.objectStore("motors");

    if(editId) {
        motorData.id = parseInt(editId);
        store.get(motorData.id).onsuccess = (ev) => {
            const existing = ev.target.result;
            motorData.pics = picsArray.length > 0 ? picsArray : (existing.pics || []);
            store.put(motorData);
        };
    } else {
        motorData.pics = picsArray;
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert(editId ? "डेटा अपडेट हो गया!" : "नया रिकॉर्ड सुरक्षित हो गया!");
        closeForm();
        loadMotors();
    };
};

function loadMotors() {
    const list = document.getElementById('motorList');
    list.innerHTML = "";
    const store = db.transaction("motors").objectStore("motors");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-md flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="motor-title font-bold text-orange-400 uppercase text-lg">${m.name} ${m.company ? `(${m.company})` : ''}</h3>
                        <p class="text-xs text-slate-400 italic">स्लॉट: ${m.slots || '-'} | वायर: ${m.wireType || '-'} | स्टांपिंग: ${m.stamping || '-'}</p>
                    </div>
                    <span class="text-slate-600 text-2xl">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showDetails(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        
        let imagesHTML = "";
        if(m.pics && m.pics.length > 0) {
            imagesHTML = `<div class="flex gap-2 overflow-x-auto p-4 bg-slate-900/50">`;
            m.pics.forEach((picData, index) => {
                imagesHTML += `<img src="${picData}" class="bg-pic-slider" style="width: calc(100% / ${m.pics.length > 1 ? '1.2' : '1'}); flex-shrink: 0;" alt="Pic ${index+1}">`;
            });
            imagesHTML += `</div>`;
        }

        details.innerHTML = `
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-2xl font-bold text-orange-500 uppercase mt-2">${m.name}</h2>
                <p class="text-sm text-slate-400 font-semibold border-b border-slate-700 pb-2 mb-4">कंपनी: ${m.company || '-'}</p>
                
                ${imagesHTML}

                <div class="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">Stator Core/Stamp:</span>
                        <b class="text-white text-sm">${m.stamping || '-'}</b>
                    </div>
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">ID / OD Size:</span>
                        <b class="text-white text-sm">${m.idSize || '-'} / ${m.odSize || '-'}</b>
                    </div>
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">Slots / Wire Metal:</span>
                        <b class="text-white text-sm">${m.slots || '-'} / ${m.wireType || '-'}</b>
                    </div>
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">कुल वायर वजन:</span>
                        <b class="text-white text-sm">${m.totalWeight ? m.totalWeight+'g' : '-'}</b>
                    </div>
                </div>

                <div class="bg-blue-600/10 p-3 rounded-xl border border-blue-400/20 shadow-md mb-3 text-xs">
                    <p class="font-bold text-blue-400 border-b border-blue-400/20 mb-2 uppercase text-[10px]">Running Coil Data</p>
                    <div class="grid grid-cols-3 gap-y-2">
                        <p class="text-slate-300">Guage: <b class="text-white text-sm block">${m.running.guage || '-'}</b></p>
                        <p class="text-slate-300">Pitch: <b class="text-white text-sm block">${m.running.pitch || '-'}</b></p>
                        <p class="text-slate-300">Round: <b class="text-white text-sm block">${m.running.round || '-'}</b></p>
                        <p class="text-slate-300">Turns: <b class="text-white text-sm block">${m.running.turns || '-'}</b></p>
                        <p class="text-slate-300">Coil Length: <b class="text-white text-sm block">${m.running.length || '-'}</b></p>
                        <p class="text-slate-300">Coil Weight: <b class="text-white text-sm block">${m.running.weight ? m.running.weight+'g' : '-'}</b></p>
                    </div>
                </div>

                <div class="bg-green-600/10 p-3 rounded-xl border border-green-400/20 shadow-md mb-3 text-xs">
                    <p class="font-bold text-green-400 border-b border-green-400/20 mb-2 uppercase text-[10px]">Starting Coil Data</p>
                    <div class="grid grid-cols-3 gap-y-2">
                        <p class="text-slate-300">Guage: <b class="text-white text-sm block">${m.starting.guage || '-'}</b></p>
                        <p class="text-slate-300">Pitch: <b class="text-white text-sm block">${m.starting.pitch || '-'}</b></p>
                        <p class="text-slate-300">Round: <b class="text-white text-sm block">${m.starting.round || '-'}</b></p>
                        <p class="text-slate-300">Turns: <b class="text-white text-sm block">${m.starting.turns || '-'}</b></p>
                        <p class="text-slate-300">Coil Length: <b class="text-white text-sm block">${m.starting.length || '-'}</b></p>
                        <p class="text-slate-300">Coil Weight: <b class="text-white text-sm block">${m.starting.weight ? m.starting.weight+'g' : '-'}</b></p>
                    </div>
                </div>

                <div class="bg-slate-700/30 p-3 rounded-xl border border-slate-600/50 grid grid-cols-3 gap-2 text-xs mb-4">
                    <div>
                        <span class="text-slate-400 block">पेपर साइज (L×H):</span>
                        <b class="text-white">${m.paperSize || '-'}</b>
                    </div>
                    <div>
                        <span class="text-slate-400 block">कनेक्शन:</span>
                        <b class="text-white">${m.connection || '-'}</b>
                    </div>
                    <div>
                        <span class="text-slate-400 block">कंडेंसर:</span>
                        <b class="text-white">${m.condenser || '-'}</b>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-4">
                    <button onclick="editData(${m.id})" class="bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm shadow-md">सुधारें (Edit)</button>
                    <button onclick="deleteData(${m.id})" class="bg-red-500/80 text-white font-bold py-2.5 rounded-lg text-sm shadow-md">डिलीट</button>
                </div>
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

function editData(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        document.getElementById('editId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('companyName').value = m.company || "";
        document.getElementById('stamping').value = m.stamping || "";
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('odSize').value = m.odSize || "";
        document.getElementById('slots').value = m.slots || "";
        document.getElementById('wireType').value = m.wireType || "Copper";
        document.getElementById('totalWeight').value = m.totalWeight || "";
        document.getElementById('paperSize').value = m.paperSize || "";
        document.getElementById('connection').value = m.connection || "";
        document.getElementById('condenser').value = m.condenser || "";
        
        document.getElementById('rGuage').value = m.running.guage || "";
        document.getElementById('rPitch').value = m.running.pitch || "";
        document.getElementById('rRound').value = m.running.round || "";
        document.getElementById('rTurns').value = m.running.turns || "";
        document.getElementById('rWeight').value = m.running.weight || "";
        document.getElementById('rLength').value = m.running.length || "";

        document.getElementById('sGuage').value = m.starting.guage || "";
        document.getElementById('sPitch').value = m.starting.pitch || "";
        document.getElementById('sRound').value = m.starting.round || "";
        document.getElementById('sTurns').value = m.starting.turns || "";
        document.getElementById('sWeight').value = m.starting.weight || "";
        document.getElementById('sLength').value = m.starting.length || "";

        document.getElementById('modalTitle').innerText = "डेटा सुधारें";
        document.getElementById('saveButton').innerText = "अपडेट करें";
        
        closeDetails();
        document.getElementById('entryModal').classList.remove('hidden');
    };
}

function deleteData(id) {
    if(confirm("क्या आप वाकई इस डेटा को हटाना चाहते हैं?")) {
        db.transaction("motors", "readwrite").objectStore("motors").delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

function exportData() {
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const data = JSON.stringify(e.target.result);
        const blob = new Blob([data], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Maa_Bhagwati_Winding_Advanced_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction("motors", "readwrite");
            data.forEach(m => { delete m.id; tx.objectStore("motors").add(m); });
            tx.oncomplete = () => { alert("बैकअप सफलतापूर्वक लोड हो गया!"); loadMotors(); };
        } catch(err) { alert("गलत फाइल फॉर्मेट!"); }
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let filter = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(card => {
        let nameText = card.querySelector('.motor-title').innerText.toUpperCase();
        card.style.display = nameText.includes(filter) ? "" : "none";
    });
  }
          

// ग्राहक फॉर्म सबमिट होने पर डेटा सेव करने का फंक्शन
document.getElementById('customerForm').onsubmit = (e) => {
    e.preventDefault(); // पेज को रीलोड होने से रोकना
    
    const editId = document.getElementById('customerEditId').value;
    
    // फॉर्म से सारा डेटा ऑब्जेक्ट में इकट्ठा करना
    const customerData = {
        customerName: document.getElementById('cName').value.trim(),
        customerMobile: document.getElementById('cMobile').value.trim(),
        jobDate: document.getElementById('cJobDate').value,
        motorTitle: document.getElementById('cMotorCustom').value.trim() || "Unknown Motor",
        totalWeight: parseFloat(document.getElementById('cMotorWeight').value) || 0,
        totalCharge: parseFloat(document.getElementById('cTotalCharge').value) || 0,
        advancePaid: parseFloat(document.getElementById('cAdvancePaid').value) || 0,
        faultNote: document.getElementById('cFaultNote').value.trim()
    };

    // IndexedDB में डेटा लिखना
    const tx = db.transaction("customers", "readwrite");
    const store = tx.objectStore("customers");

    if (editId) {
        // अगर पुराने रिकॉर्ड को सुधार रहे हैं
        customerData.id = parseInt(editId);
        store.put(customerData);
    } else {
        // अगर बिल्कुल नया रिकॉर्ड जोड़ रहे हैं
        store.add(customerData);
    }

    tx.oncomplete = () => {
        alert("कस्टमर रिकॉर्ड सफलतापूर्वक सुरक्षित हो गया!");
        closeModal('customerModal'); // फॉर्म बंद करना
        loadCustomers(); // ग्राहक लिस्ट दोबारा लोड करना
    };
    
    tx.onerror = () => {
        alert("डेटा सेव करने में कोई गड़बड़ी हुई!");
    };
};

// डायरी से सेलेक्ट की गई मोटर का वजन अपने आप भरने के लिए फंक्शन
function autoFillWeight() {
    const select = document.getElementById("cMotorSelect");
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.value !== "") {
        // मोटर का वजन और नाम इनपुट बॉक्स में ऑटोमैटिक डालना
        document.getElementById("cMotorWeight").value = selectedOption.getAttribute("data-weight");
        document.getElementById("cMotorCustom").value = selectedOption.text;
    }
}
