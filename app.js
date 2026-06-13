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
        c.style.display = c.querySelector('.data-titldiv class="bg-blue-600/10 p-3 rounded-xl border border-blue-400/20 text-xs mb-3">
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

// मोटर डेटा एडिट करना
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

// ================= CUSTOMER RECORD LOGIC =================

// कस्टमर फॉर्म सबमिट होना
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

// ग्राहकों की लिस्ट लोड करना
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

// कस्टमर बिल और खाता रिकॉर्ड का पूरा विवरण दिखाना
function showCustomerDetails(id) {
    db.transaction("customers").objectStore("customers").get(id).onsuccess = (e) => {
        const c = e.target.result;
        const details = document.getElementById('detailsContent');
        const rate = parseFloat(document.getElementById('wireRateInput').value) || 0;
        const wireCost = Math.round((c.totalWeight / 1000) * rate);
        const balance = c.totalCharge - c.advancePaid;

        let noteHTML = "";
        if(c.faultNote) {
            noteHTML = `<div class="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-xs"><span class="text-red-400 font-bold block">फॉल्ट नोट:</span><p class="italic">${c.faultNote}</p></div>`;
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

// कस्टमर रिकॉर्ड एडिट करना
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

// ================= GLOBAL TOOLS ========R: ${m.running.round}</span>
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
        c.style.display = c.querySelector('.data-title').innerText.toUpperCase().includes(f) || c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}

function exportAllData() {
    const backup = {};
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e1) => {
        backup.motors = e1.target.result;
        db.transaction("customers").objectStore("customers").getAll().onsuccess = (e2) => {
            backup.customers = e2.target.result;
            const blob = new Blob([JSON.stringify(backup)], {type: "application/json"});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            
            let dateStr = new Date().toLocaleDateString().replace(/\//g, "-");
            a.download = `Maa_Bhagwati_Full_Backup_${dateStr}.json`;
            a.click();
        };
    };
}

function importAllData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const txM = db.transaction("motors", "readwrite");
            if(data.motors) data.motors.forEach(m => { delete m.id; txM.objectStore("motors").add(m); });
            
                    txM.oncomplete = () => {
                        const txC = db.transaction("customers", "readwrite");
                        if(data.customers) data.customers.forEach(c => { delete c.id; txC.objectStore("customers").add(c); });
                        txC.oncomplete = () => { alert("पूरा डेटा (मोटर + ग्राहक) सफलतापूर्वक रीस्टोर हो गया!"); renderCurrentTab(); };
                    };
        } catch(err) { alert("गलत फाइल फॉर्मेट!"); }
    };
    reader.readAsText(event.target.files[0]);
}
