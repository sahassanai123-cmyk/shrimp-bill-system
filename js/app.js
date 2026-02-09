/* ===================================
   FARM BILLING SYSTEM - FIXED ALL 9 ISSUES
   =================================== */

// ===== STORAGE KEYS =====
const STORAGE = {
    FARMS: 'farmBillPro_farms',
    ASSETS: 'farmBillPro_assets',
    BILLS: 'farmBillPro_bills',
    THEME: 'farmBillPro_theme'
};

// ===== GLOBAL STATE =====
let farms = {};
let assets = {};
let bills = [];
let currentBillId = null;
let splitItemsData = {}; // เก็บข้อมูลการหารบ่อ

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadData();
    initializeUI();
    setTodayDate();
});

// ===== THEME MANAGEMENT =====
function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE.THEME, newTheme);
    updateThemeIcon(newTheme);
    showToast('เปลี่ยนธีมเรียบร้อย', 'info');
}

function updateThemeIcon(theme) {
    document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== DATA MANAGEMENT =====
function loadData() {
    const savedFarms = localStorage.getItem(STORAGE.FARMS);
    if (savedFarms) {
        farms = JSON.parse(savedFarms);
    } else {
        farms = {
            1: { name: "ฟาร์มที่ 1", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] },
            2: { name: "ฟาร์มที่ 2", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] },
            3: { name: "ฟาร์มที่ 3", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] },
            4: { name: "ฟาร์มที่ 4", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] }
        };
        saveFarms();
    }

    const savedAssets = localStorage.getItem(STORAGE.ASSETS);
    if (savedAssets) {
        assets = JSON.parse(savedAssets);
    } else {
        loadAssetsFromFile();
    }

    const savedBills = localStorage.getItem(STORAGE.BILLS);
    if (savedBills) {
        bills = JSON.parse(savedBills);
    }
}

function loadAssetsFromFile() {
    fetch('Asset.txt')
        .then(res => res.text())
        .then(data => {
            const lines = data.split('\n');
            lines.forEach(line => {
                const parts = line.trim().split(',');
                if (parts.length === 3) {
                    const [type, name, price] = parts;
                    if (type && name && price) {
                        if (!assets[type]) {
                            assets[type] = [];
                        }
                        assets[type].push({
                            name: name.trim(),
                            price: parseFloat(price)
                        });
                    }
                }
            });
            saveAssets();
            renderAssetList();
        })
        .catch(err => {
            console.log('Asset.txt not found');
            saveAssets();
        });
}

function saveFarms() {
    localStorage.setItem(STORAGE.FARMS, JSON.stringify(farms));
}

function saveAssets() {
    localStorage.setItem(STORAGE.ASSETS, JSON.stringify(assets));
}

function saveBills() {
    localStorage.setItem(STORAGE.BILLS, JSON.stringify(bills));
}

// ===== UI INITIALIZATION =====
function initializeUI() {
    populateFarmSelects();
    renderAssetList();
    renderHistory();
    updateStats();
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('billDate').value = today;
}

function populateFarmSelects() {
    const selects = ['farmSelect', 'manageFarmSelect', 'historyFarmFilter'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const currentValue = select.value;
        
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        Object.keys(farms).forEach(farmId => {
            const option = document.createElement('option');
            option.value = farmId;
            option.textContent = farms[farmId].name;
            select.appendChild(option);
        });
        
        if (currentValue && farms[currentValue]) {
            select.value = currentValue;
        }
    });
}

// ===== NAVIGATION (ข้อ 3: รีเฟรชทุกครั้ง) =====
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });
    
    // รีเฟรชเมื่อไปหน้าอื่น
    if (page === 'create') {
        resetCreatePage();
    } else if (page === 'history') {
        renderHistory();
    } else if (page === 'manage') {
        renderAssetList();
    } else if (page === 'settings') {
        updateStats();
    }
}

function resetCreatePage() {
    document.getElementById('farmSelect').value = '';
    document.getElementById('pondsSection').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    document.getElementById('pondCountDisplay').style.display = 'none';
    document.getElementById('pondsContainer').innerHTML = '';
    splitItemsData = {};
    setTodayDate();
}

// ===== CREATE BILL PAGE =====
function loadPonds() {
    const farmId = document.getElementById('farmSelect').value;
    const pondsSection = document.getElementById('pondsSection');
    const pondsContainer = document.getElementById('pondsContainer');
    const actionBar = document.getElementById('actionBar');
    const pondCountDisplay = document.getElementById('pondCountDisplay');
    const pondCountValue = document.getElementById('pondCountValue');
    
    if (!farmId) {
        pondsSection.style.display = 'none';
        actionBar.style.display = 'none';
        pondCountDisplay.style.display = 'none';
        return;
    }
    
    const farm = farms[farmId];
    pondsSection.style.display = 'block';
    pondCountDisplay.style.display = 'block';
    pondCountValue.textContent = farm.ponds.length;
    
    pondsContainer.innerHTML = '';
    splitItemsData = {};
    
    farm.ponds.forEach((pondName, index) => {
        const pondCard = createPondCard(pondName, index);
        pondsContainer.appendChild(pondCard);
        addAssetRow(index);
    });
    
    actionBar.style.display = 'flex';
    updateGrandTotal();
}

function createPondCard(pondName, pondIndex) {
    const card = document.createElement('div');
    card.className = 'pond-card';
    card.id = `pond-${pondIndex}`;
    
    card.innerHTML = `
        <div class="pond-header" onclick="togglePond(${pondIndex})">
            <h3 class="pond-title">${pondName}</h3>
            <button class="pond-toggle" type="button">▼</button>
        </div>
        <div class="pond-content" id="pond-content-${pondIndex}">
            <table class="asset-table" id="table-${pondIndex}">
                <thead>
                    <tr>
                        <th style="width: 10%">ประเภท</th>
                        <th style="width: 35%">สินค้า</th>
                        <th style="width: 10%">จำนวน</th>
                        <th style="width: 13%">ราคา/หน่วย</th>
                        <th style="width: 15%">รวม</th>
                        <th style="width: 7%"></th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div class="add-asset-btns">
                <button class="btn-success" onclick="addAssetRow(${pondIndex})">+ เพิ่มสินค้า</button>
                <button class="btn-secondary" onclick="addSplitRow(${pondIndex})">÷ หารบ่อ</button>
                <button class="btn-secondary" onclick="addOtherRow(${pondIndex})">✎ อื่นๆ</button>
            </div>
            <div class="pond-total" id="pond-total-${pondIndex}">รวม: 0.00 บาท</div>
        </div>
    `;
    
    return card;
}

function togglePond(index) {
    const content = document.getElementById(`pond-content-${index}`);
    const toggle = content.previousElementSibling.querySelector('.pond-toggle');
    
    content.classList.toggle('collapsed');
    toggle.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
}

function expandAllPonds() {
    document.querySelectorAll('.pond-content').forEach(content => {
        content.classList.remove('collapsed');
        content.previousElementSibling.querySelector('.pond-toggle').textContent = '▼';
    });
}

function addAssetRow(pondIndex) {
    const tbody = document.querySelector(`#table-${pondIndex} tbody`);
    const row = tbody.insertRow();
    
    let qtyOptions = '<option value="0">0</option>';
    for (let i = 1; i <= 50; i++) {
        qtyOptions += `<option value="${i}" ${i === 1 ? 'selected' : ''}>${i}</option>`;
    }
    
    row.innerHTML = `
        <td>
            <select class="input-field asset-type" onchange="updateAssetOptions(this, ${pondIndex})">
                <option value="">--</option>
                ${Object.keys(assets).sort().map(type => 
                    `<option value="${type}">${type}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <select class="input-field asset-name" onchange="updatePrice(this)" disabled>
                <option value="">เลือกประเภทก่อน</option>
            </select>
        </td>
        <td>
            <select class="input-field asset-qty" onchange="calculateRowTotal(this)">
                ${qtyOptions}
            </select>
        </td>
        <td>
            <input type="number" class="input-field asset-price" value="0" min="0" step="0.01" readonly>
        </td>
        <td>
            <input type="text" class="input-field asset-total" value="0.00" readonly>
        </td>
        <td>
            <div class="asset-actions">
                <button class="icon-btn delete" onclick="deleteRow(this)" title="ลบ">🗑️</button>
            </div>
        </td>
    `;
}

// ข้อ 1: หารบ่อแบบใหม่ - เลือกได้หลายบ่อ (ข้อ 2: ปุ่มอยู่บรรทัดเดียว, ข้อ 3: แสดงราคาในบ่อทันที)
function addSplitRow(pondIndex) {
    const tbody = document.querySelector(`#table-${pondIndex} tbody`);
    const row = tbody.insertRow();
    
    let qtyOptions = '<option value="0">0</option>';
    for (let i = 1; i <= 50; i++) {
        qtyOptions += `<option value="${i}" ${i === 1 ? 'selected' : ''}>${i}</option>`;
    }
    
    const farmId = document.getElementById('farmSelect').value;
    const farm = farms[farmId];
    const splitId = `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    row.dataset.splitId = splitId;
    row.className = 'split-row';
    
    // ข้อ 3: Design ใหม่สำหรับหารบ่อ - เด่นชัด มีพื้นหลังสี
    row.innerHTML = `
        <td>
            <div class="split-type-badge">
                <span class="split-icon">÷</span>
                หาร
            </div>
        </td>
        <td style="position: relative;">
            <div style="display: flex; gap: 6px; align-items: center;">
                <input type="text" class="input-field split-description" placeholder="ชื่อสินค้าที่หาร" style="flex: 1; border-left: 3px solid var(--success);" oninput="updateSplitRowsInPonds('${splitId}')">
                <button type="button" class="btn-split-selector" onclick="togglePondSelector('${splitId}')">
                    <span class="split-selector-icon">🦐</span>
                    <span id="count-${splitId}">0</span> บ่อ
                </button>
            </div>
            <div id="selector-${splitId}" class="pond-selector" style="display: none; position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; padding: 8px; background: var(--bg-secondary); border: 2px solid var(--success); border-radius: 6px; max-height: 180px; overflow-y: auto; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="font-size: 0.7rem; color: var(--success); font-weight: 600; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                    ✓ เลือกบ่อที่ต้องการหาร (อย่างน้อย 2 บ่อ)
                </div>
                ${farm.ponds.map((pondName, idx) => `
                    <label class="pond-checkbox-label">
                        <input type="checkbox" class="pond-checkbox" value="${idx}" data-split-id="${splitId}" onchange="updateSplitPonds('${splitId}')">
                        <span class="pond-checkbox-text">${pondName}</span>
                    </label>
                `).join('')}
            </div>
        </td>
        <td>
            <select class="input-field asset-qty" onchange="calculateSplitTotal('${splitId}')">
                ${qtyOptions}
            </select>
        </td>
        <td><input type="number" class="input-field asset-price split-price" value="0" min="0" step="0.01" 
                   oninput="calculateSplitTotal('${splitId}')" placeholder="ราคารวม"></td>
        <td><input type="text" class="input-field asset-total split-total" value="0.00" readonly></td>
        <td>
            <div class="asset-actions">
                <button class="icon-btn delete" onclick="deleteSplitRow(this, '${splitId}')" title="ลบ">🗑️</button>
            </div>
        </td>
    `;
    
    splitItemsData[splitId] = { 
        ponds: [], 
        sourcePondIndex: pondIndex,
        description: '',
        qty: 1,
        totalPrice: 0
    };
}

function togglePondSelector(splitId) {
    const selector = document.getElementById(`selector-${splitId}`);
    const isVisible = selector.style.display !== 'none';
    
    // ปิด selector อื่นๆ ทั้งหมด
    document.querySelectorAll('.pond-selector').forEach(s => {
        if (s.id !== `selector-${splitId}`) {
            s.style.display = 'none';
        }
    });
    
    selector.style.display = isVisible ? 'none' : 'block';
}

function updateSplitPonds(splitId) {
    const checkboxes = document.querySelectorAll(`input[data-split-id="${splitId}"]:checked`);
    const selectedPonds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (!splitItemsData[splitId]) {
        splitItemsData[splitId] = { ponds: [], sourcePondIndex: 0, description: '', qty: 1, totalPrice: 0 };
    }
    
    splitItemsData[splitId].ponds = selectedPonds;
    
    // อัพเดทจำนวนบ่อที่เลือก
    const countSpan = document.getElementById(`count-${splitId}`);
    if (countSpan) {
        countSpan.textContent = selectedPonds.length;
    }
    
    calculateSplitTotal(splitId);
    updateSplitRowsInPonds(splitId);
}

function calculateSplitTotal(splitId) {
    const row = document.querySelector(`[data-split-id="${splitId}"]`);
    if (!row) return;
    
    const selectedPonds = splitItemsData[splitId]?.ponds || [];
    const qtyElement = row.querySelector('.asset-qty');
    const priceElement = row.querySelector('.asset-price');
    const totalElement = row.querySelector('.asset-total');
    
    const qty = parseFloat(qtyElement.value) || 0;
    const totalPrice = parseFloat(priceElement.value) || 0;
    
    // เก็บข้อมูล
    if (splitItemsData[splitId]) {
        splitItemsData[splitId].qty = qty;
        splitItemsData[splitId].totalPrice = totalPrice;
    }
    
    if (selectedPonds.length < 2) {
        totalElement.value = '0.00';
        if (selectedPonds.length === 1 && totalPrice > 0) {
            showToast('กรุณาเลือกอย่างน้อย 2 บ่อสำหรับการหาร', 'error');
        }
        removeAllSplitDisplayRows(splitId);
        return;
    }
    
    // สูตรที่ถูกต้อง: (ราคารวม × จำนวน) หาร จำนวนบ่อ
    const perPond = (totalPrice * qty) / selectedPonds.length;
    totalElement.value = perPond.toFixed(2);
    
    const sourcePondCard = row.closest('.pond-card');
    if (sourcePondCard) {
        updatePondTotal(sourcePondCard);
    }
    
    updateSplitRowsInPonds(splitId);
}

// FIX: ฟังก์ชันแสดงราคาหารบ่อในแต่ละบ่อทันที - แก้บั๊กการคำนวณ
function updateSplitRowsInPonds(splitId) {
    const splitData = splitItemsData[splitId];
    if (!splitData) return;
    
    const mainRow = document.querySelector(`[data-split-id="${splitId}"]`);
    if (!mainRow) return;
    
    const descriptionInput = mainRow.querySelector('.split-description');
    const description = descriptionInput ? descriptionInput.value : '';
    const qty = splitData.qty || 0;
    const totalPrice = splitData.totalPrice || 0;
    const selectedPonds = splitData.ponds || [];
    
    // เก็บ description
    if (splitItemsData[splitId]) {
        splitItemsData[splitId].description = description;
    }
    
    // ลบแถวแสดงผลเก่าทั้งหมด
    removeAllSplitDisplayRows(splitId);
    
    if (selectedPonds.length >= 2 && qty > 0 && totalPrice > 0) {
        // สูตรที่ถูกต้อง
        const perPond = (totalPrice * qty) / selectedPonds.length;
        
        // เพิ่มแถวแสดงผลในทุกบ่อที่เลือก
        selectedPonds.forEach(pondIdx => {
            const pondCard = document.getElementById(`pond-${pondIdx}`);
            if (!pondCard) return;
            
            const tbody = pondCard.querySelector('tbody');
            const displayRow = tbody.insertRow();
            displayRow.className = 'split-display-row';
            displayRow.dataset.splitId = splitId;
            
            // FIX: เพิ่ม hidden input class="asset-total" เพื่อให้คำนวณยอดรวมได้
            displayRow.innerHTML = `
                <td>
                    <div class="split-badge"></div>
                </td>
                <td>
                    <div class="split-name">${description || '(รอกรอกรายละเอียด)'}</div>
                </td>
                <td style="text-align: left; font-weight: 500;">${qty}</td>
                <td style="text-align: left; font-weight: 500;">${perPond.toFixed(2)}</td>
                <td style="text-align: left;">
                    <input type="hidden" class="asset-total" value="${perPond.toFixed(2)}">
                    <span style="font-weight: 500;">${perPond.toFixed(2)}</span>
                </td>
                <td style="text-align: center;">
                    <span class="split-tag">แสดงผล</span>
                </td>
            `;
            
            updatePondTotal(pondCard);
        });
    }
    
    updateGrandTotal();
}

function removeAllSplitDisplayRows(splitId) {
    document.querySelectorAll(`.split-display-row[data-split-id="${splitId}"]`).forEach(row => {
        const pondCard = row.closest('.pond-card');
        row.remove();
        if (pondCard) {
            updatePondTotal(pondCard);
        }
    });
    updateGrandTotal();
}

function deleteSplitRow(btn, splitId) {
    const row = btn.closest('tr');
    const tbody = row.closest('tbody');
    const pondCard = row.closest('.pond-card');
    
    if (tbody.rows.length <= 1) {
        showToast('ต้องมีอย่างน้อย 1 รายการในแต่ละบ่อ', 'error');
        return;
    }
    
    // ลบแถวแสดงผลในบ่อต่างๆ
    removeAllSplitDisplayRows(splitId);
    
    // ลบข้อมูล
    delete splitItemsData[splitId];
    
    // ลบแถวหลัก
    row.remove();
    updatePondTotal(pondCard);
}

function addOtherRow(pondIndex) {
    const tbody = document.querySelector(`#table-${pondIndex} tbody`);
    const row = tbody.insertRow();
    
    let qtyOptions = '<option value="0">0</option>';
    for (let i = 1; i <= 50; i++) {
        qtyOptions += `<option value="${i}" ${i === 1 ? 'selected' : ''}>${i}</option>`;
    }
    
    row.innerHTML = `
        <td><input type="text" class="input-field" value="อื่นๆ"></td>
        <td><input type="text" class="input-field" placeholder="รายละเอียด"></td>
        <td>
            <select class="input-field asset-qty" onchange="calculateRowTotal(this)">
                ${qtyOptions}
            </select>
        </td>
        <td><input type="number" class="input-field asset-price" value="0" min="0" step="0.01" 
                   oninput="calculateRowTotal(this)"></td>
        <td><input type="text" class="input-field asset-total" value="0.00" readonly></td>
        <td>
            <div class="asset-actions">
                <button class="icon-btn delete" onclick="deleteRow(this)" title="ลบ">🗑️</button>
            </div>
        </td>
    `;
    
    calculateRowTotal(row.querySelector('.asset-qty'));
}

function updateAssetOptions(typeSelect, pondIndex) {
    const row = typeSelect.closest('tr');
    const nameSelect = row.querySelector('.asset-name');
    const type = typeSelect.value;
    
    nameSelect.innerHTML = '<option value="">-- เลือกสินค้า --</option>';
    
    if (type && assets[type]) {
        nameSelect.disabled = false;
        assets[type].forEach((asset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = asset.name;
            option.dataset.price = asset.price;
            nameSelect.appendChild(option);
        });
    } else {
        nameSelect.disabled = true;
    }
    
    updatePrice(nameSelect);
}

function updatePrice(nameSelect) {
    const row = nameSelect.closest('tr');
    const selectedOption = nameSelect.options[nameSelect.selectedIndex];
    const priceInput = row.querySelector('.asset-price');
    
    if (selectedOption && selectedOption.dataset.price) {
        priceInput.value = parseFloat(selectedOption.dataset.price).toFixed(2);
    } else {
        priceInput.value = '0.00';
    }
    
    calculateRowTotal(priceInput);
}

function calculateRowTotal(input) {
    const row = input.closest('tr');
    const qtyElement = row.querySelector('.asset-qty');
    const priceElement = row.querySelector('.asset-price');
    const totalInput = row.querySelector('.asset-total');
    
    let qty = 0;
    if (qtyElement.tagName === 'SELECT') {
        qty = parseFloat(qtyElement.value) || 0;
    } else {
        qty = parseFloat(qtyElement.value) || 0;
    }
    
    const price = parseFloat(priceElement.value) || 0;
    const total = qty * price;
    totalInput.value = total.toFixed(2);
    
    updatePondTotal(row.closest('.pond-card'));
}

function updatePondTotal(pondCard) {
    const rows = pondCard.querySelectorAll('tbody tr');
    let total = 0;
    
    rows.forEach(row => {
        const totalInput = row.querySelector('.asset-total');
        if (totalInput) {
            const rowTotal = parseFloat(totalInput.value) || 0;
            total += rowTotal;
        }
    });
    
    const pondIndex = pondCard.id.split('-')[1];
    const pondTotalDiv = document.getElementById(`pond-total-${pondIndex}`);
    if (pondTotalDiv) {
        pondTotalDiv.textContent = `รวม: ${total.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`;
    }
    
    updateGrandTotal();
}

function updateGrandTotal() {
    let grandTotal = 0;
    
    // คำนวณจากผลรวมของแต่ละบ่อ
    document.querySelectorAll('.pond-card').forEach(card => {
        const rows = card.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const totalInput = row.querySelector('.asset-total');
            if (totalInput) {
                const rowTotal = parseFloat(totalInput.value) || 0;
                grandTotal += rowTotal;
            }
        });
    });
    
    const grandTotalElement = document.getElementById('grandTotal');
    if (grandTotalElement) {
        grandTotalElement.textContent = grandTotal.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' บาท';
    }
}

function deleteRow(btn) {
    const row = btn.closest('tr');
    const tbody = row.closest('tbody');
    const pondCard = row.closest('.pond-card');
    
    // นับเฉพาะแถวจริง ไม่นับ split-display-row
    const allRows = tbody.querySelectorAll('tr:not(.split-display-row)');
    if (allRows.length <= 1) {
        showToast('แต่ละบ่อต้องมีอย่างน้อย 1 รายการ', 'error');
        return;
    }
    
    row.remove();
    updatePondTotal(pondCard);
}

// ข้อ 1 & 2: ตรวจสอบว่ามีสินค้าอย่างน้อย 1 บ่อในฟาร์ม และบ่อไม่มีสินค้าไม่เอาไปสร้างบิล
function saveBill() {
    const farmId = document.getElementById('farmSelect').value;
    const date = document.getElementById('billDate').value;
    
    if (!farmId || !date) {
        showToast('กรุณาเลือกฟาร์มและวันที่', 'error');
        return;
    }
    
    // ตรวจสอบว่ามีสินค้าอย่างน้อย 1 บ่อในฟาร์ม
    const pondCards = document.querySelectorAll('.pond-card');
    let hasAnyValidPond = false;
    
    for (let cardIndex = 0; cardIndex < pondCards.length; cardIndex++) {
        const card = pondCards[cardIndex];
        const pondName = card.querySelector('.pond-title').textContent;
        const rows = card.querySelectorAll('tbody tr:not(.split-display-row)');
        
        let hasValidItem = false;
        
        for (const row of rows) {
            // ตรวจสอบว่าเป็นแถวหารบ่อหรือไม่
            if (row.classList.contains('split-row')) {
                const splitId = row.dataset.splitId;
                const selectedPonds = splitItemsData[splitId]?.ponds || [];
                const description = row.querySelector('.split-description').value.trim();
                const qty = parseFloat(row.querySelector('.asset-qty').value) || 0;
                const price = parseFloat(row.querySelector('.asset-price').value) || 0;
                
                // ถ้ามีการกรอกจำนวน ต้องกรอกให้ครบถ้วน
                if (qty > 0) {
                    if (!description) {
                        showToast(`${pondName}: กรุณากรอกรายละเอียดสำหรับรายการหารบ่อ`, 'error');
                        return;
                    }
                    
                    if (selectedPonds.length < 2) {
                        showToast(`${pondName}: กรุณาเลือกอย่างน้อย 2 บ่อสำหรับการหาร`, 'error');
                        return;
                    }
                    
                    if (price <= 0) {
                        showToast(`${pondName}: กรุณาระบุราคาสำหรับรายการหารบ่อ`, 'error');
                        return;
                    }
                    
                    hasValidItem = true;
                }
            } else {
                // แถวปกติ
                const qty = parseFloat(row.querySelector('.asset-qty')?.value || '0');
                const price = parseFloat(row.querySelector('.asset-price')?.value || '0');
                const typeElement = row.cells[0].querySelector('.asset-type') || row.cells[0].querySelector('input');
                const nameElement = row.cells[1].querySelector('.asset-name') || row.cells[1].querySelector('input');
                
                const type = typeElement?.value || '';
                
                // ดึง name และกรองข้อความ placeholder ออก
                let name = '';
                if (nameElement?.tagName === 'SELECT') {
                    const selectedValue = nameElement.value;
                    const selectedText = nameElement.selectedOptions?.[0]?.textContent || '';
                    // ถ้าเลือกตัวเลือกที่มีค่า (ไม่ใช่ "", และไม่ใช่ข้อความ placeholder)
                    if (selectedValue && selectedText && !selectedText.includes('เลือก') && !selectedText.includes('--')) {
                        name = selectedText;
                    }
                } else {
                    name = nameElement?.value || '';
                }
                
                // เช็คว่ามีการกรอกข้อมูลหรือไม่ (type, name, หรือ price > 0)
                const hasAnyInput = type || name || price > 0;
                
                // ถ้ามีการกรอกข้อมูลอะไรก็ตาม ต้องกรอกให้ครบถ้วน
                if (hasAnyInput) {
                    if (qty <= 0) {
                        showToast(`${pondName}: กรุณาระบุจำนวน`, 'error');
                        return;
                    }
                    if (!type && !name) {
                        showToast(`${pondName}: กรุณาเลือกสินค้าหรือกรอกรายละเอียด`, 'error');
                        return;
                    }
                    if (price <= 0) {
                        showToast(`${pondName}: กรุณาระบุราคาสินค้า`, 'error');
                        return;
                    }
                    hasValidItem = true;
                }
            }
        }
        
        // ถ้าบ่อนี้มีสินค้า นับว่าฟาร์มมีข้อมูลแล้ว
        if (hasValidItem) {
            hasAnyValidPond = true;
        }
    }
    
    // ตรวจสอบว่าต้องมีอย่างน้อย 1 บ่อที่มีสินค้า
    if (!hasAnyValidPond) {
        showToast('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการใน 1 บ่อ', 'error');
        return;
    }
    
    // สร้างบิล
    const billData = {
        id: Date.now().toString(),
        farmId: farmId,
        farmName: farms[farmId].name,
        date: date,
        ponds: [],
        total: 0
    };
    
    // รวบรวมข้อมูลหารบ่อก่อน
    const allSplitItems = {};
    pondCards.forEach((card, cardIndex) => {
        const rows = card.querySelectorAll('tbody tr.split-row');
        rows.forEach(row => {
            const splitId = row.dataset.splitId;
            if (splitItemsData[splitId]) {
                const description = row.querySelector('.split-description').value;
                const qty = parseFloat(row.querySelector('.asset-qty').value) || 0;
                const totalPrice = parseFloat(row.querySelector('.asset-price').value) || 0;
                const selectedPonds = splitItemsData[splitId].ponds;
                
                if (selectedPonds.length >= 2 && qty > 0 && totalPrice > 0) {
                    // สูตรที่ถูกต้อง: (ราคารวม × จำนวน) หาร จำนวนบ่อ
                    const perPond = (totalPrice * qty) / selectedPonds.length;
                    
                    allSplitItems[splitId] = {
                        description,
                        qty,
                        totalPrice,
                        perPond,
                        ponds: selectedPonds
                    };
                }
            }
        });
    });
    
    // รวบรวมข้อมูลแต่ละบ่อ
    pondCards.forEach((card, index) => {
        const pondName = card.querySelector('.pond-title').textContent;
        const rows = card.querySelectorAll('tbody tr');
        const items = [];
        
        rows.forEach(row => {
            if (row.classList.contains('split-row')) {
                // ไม่เอาแถวหารบ่อเข้าไปในบ่อนี้ตอนนี้
                return;
            }
            
            // ข้าม split-display-row
            if (row.classList.contains('split-display-row')) {
                return;
            }
            
            const typeElement = row.cells[0].querySelector('.asset-type') || row.cells[0].querySelector('input');
            const nameElement = row.cells[1].querySelector('.asset-name') || row.cells[1].querySelector('input');
            
            const type = typeElement?.value || '';
            
            // ดึงชื่อสินค้าและกรอง placeholder ออก
            let name = '';
            if (nameElement?.tagName === 'SELECT') {
                const selectedValue = nameElement.value;
                const selectedText = nameElement.selectedOptions?.[0]?.textContent || '';
                // เช็คว่าเลือกสินค้าจริง ไม่ใช่ placeholder
                if (selectedValue && selectedText && !selectedText.includes('เลือก') && !selectedText.includes('--')) {
                    name = selectedText;
                }
            } else {
                name = nameElement?.value || '';
            }
            
            const qtyElement = row.querySelector('.asset-qty');
            let qty = 0;
            if (qtyElement.tagName === 'SELECT') {
                qty = parseFloat(qtyElement.value) || 0;
            } else {
                qty = parseFloat(qtyElement.value) || 0;
            }
            
            const price = parseFloat(row.querySelector('.asset-price').value) || 0;
            const total = parseFloat(row.querySelector('.asset-total').value) || 0;
            
            // เพิ่มเฉพาะสินค้าที่มีข้อมูลครบถ้วน
            if (qty > 0 && price > 0 && (type || name)) {
                items.push({ type, name, qty, price, total });
            }
        });
        
        // เพิ่มรายการหารบ่อที่เกี่ยวข้องกับบ่อนี้
        Object.keys(allSplitItems).forEach(splitId => {
            const splitItem = allSplitItems[splitId];
            if (splitItem.ponds.includes(index)) {
                items.push({
                    type: 'หาร',
                    name: splitItem.description,
                    qty: splitItem.qty,
                    price: splitItem.perPond,
                    total: splitItem.perPond
                });
            }
        });
        
        if (items.length > 0) {
            const pondTotal = items.reduce((sum, item) => sum + item.total, 0);
            billData.ponds.push({
                name: pondName,
                items: items,
                total: pondTotal
            });
            billData.total += pondTotal;
        }
    });
    
    if (billData.ponds.length === 0) {
        showToast('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'error');
        return;
    }
    
    bills.unshift(billData);
    saveBills();
    
    showToast('บันทึกบิลเรียบร้อย', 'success');
    
    currentBillId = billData.id;
    showBillPreview(billData);
}

// ข้อ 4: Preview บิลแบบ A4 ย่อขนาด
function showBillPreview(billData) {
    const modal = document.getElementById('billPreviewModal');
    const content = document.getElementById('billPreviewContent');
    
    content.innerHTML = generateBillHTML(billData);
    modal.classList.add('active');
}

function closeBillPreview() {
    document.getElementById('billPreviewModal').classList.remove('active');
    currentBillId = null;
}

function generateBillHTML(billData) {
    const dateObj = new Date(billData.date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear() + 543;
    const thaiDate = `${day}/${month}/${year}`;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const thaiTime = `${hours}:${minutes}`;
    
    let html = `
        <div class="bill-a4">
            <h2>${billData.farmName}</h2>
            <div class="bill-info">
                <div>วันที่: ${thaiDate} เวลา: ${thaiTime} น.</div>
                <div>เลขที่บิล: ${billData.id}</div>
            </div>
    `;
    
    billData.ponds.forEach(pond => {
        // ข้อ 5: เพิ่ม page-break-before สำหรับบ่อที่มีข้อมูลเยอะ
        html += `
            <div class="bill-pond-section">
                <div class="bill-pond-title">${pond.name}</div>
                <table class="bill-table">
                    <thead>
                        <tr>
                            <th style="width: 15%">ประเภท</th>
                            <th style="width: 35%">รายการ</th>
                            <th style="width: 12%">จำนวน</th>
                            <th style="width: 18%">ราคา/หน่วย</th>
                            <th style="width: 20%">รวม</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        pond.items.forEach(item => {
            html += `
                <tr>
                    <td>${item.type}</td>
                    <td>${item.name}</td>
                    <td style="text-align: right">${item.qty.toLocaleString('th-TH')}</td>
                    <td style="text-align: right">${item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                    <td style="text-align: right">${item.total.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                <div class="bill-pond-total">รวม ${pond.name} : ${pond.total.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</div>
            </div>
        `;
    });
    
    html += `
            <div class="bill-grand-total">ยอดรวมทั้งหมด : ${billData.total.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</div>
        </div>
    `;
    
    return html;
}

// ข้อ 5 & 6: Export PDF ตามโค้ดเดิม + ชื่อไฟล์ที่เหมาะสม
function exportCurrentBill() {
    const billData = bills.find(b => b.id === currentBillId);
    if (!billData) return;

    const win = window.open("bill-print.html", "_blank");

    win.onload = () => {
        win.postMessage({
            type: "PRINT_BILL",
            billData: {
                ...billData,
                printHTML: document
                    .getElementById("billPreviewContent")
                    .querySelector(".bill-a4")
                    .outerHTML
            }
        }, "*");
    };
}


function exportBillToPDF(billData) {
    const element = document.getElementById('billPreviewContent').querySelector('.bill-a4');
    if (!element) return;
    
    const farmName = billData.farmName.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '').trim();
    const dateObj = new Date(billData.date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(new Date().getHours()).padStart(2, '0');
    const minutes = String(new Date().getMinutes()).padStart(2, '0');
    
    // ข้อ 6: ชื่อไฟล์ทางการ
    const filename = `บิล${farmName}_วันที่_${day}-${month}-${year}_เวลา_${hours}-${minutes}.pdf`;
    
    window.scrollTo(0, 0);
    
    // ข้อ 5: ใช้การตั้งค่าเหมือนโค้ดเดิมทุกอย่าง
    const opt = {
        margin: [5, 10, 5, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            width: 720,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        showToast('ดาวน์โหลด PDF เรียบร้อย', 'success');
    }).catch(err => {
        console.error('PDF export error:', err);
        showToast('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    });
}

function deleteCurrentBill() {
    if (!confirm('ต้องการลบบิลนี้ใช่หรือไม่?')) return;
    
    bills = bills.filter(b => b.id !== currentBillId);
    saveBills();
    closeBillPreview();
    renderHistory();
    showToast('ลบบิลเรียบร้อย', 'success');
}

// ===== BILL HISTORY =====
function renderHistory() {
    const historyList = document.getElementById('historyList');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (bills.length === 0) {
        historyList.innerHTML = '';
        emptyHistory.style.display = 'block';
        return;
    }
    
    emptyHistory.style.display = 'none';
    
    const filteredBills = filterHistory();
    
    historyList.innerHTML = filteredBills.map(bill => `
        <div class="history-card" onclick="viewBill('${bill.id}')">
            <div class="history-card-header">
                <div class="history-farm">${bill.farmName}</div>
                <div class="history-date">${formatThaiDate(bill.date)}</div>
            </div>
            <div class="history-stats">
                <div class="history-stat">
                    <span>จำนวนบ่อ</span>
                    <span>${bill.ponds.length} บ่อ</span>
                </div>
                <div class="history-stat">
                    <span>รายการสินค้า</span>
                    <span>${bill.ponds.reduce((sum, p) => sum + p.items.length, 0)} รายการ</span>
                </div>
            </div>
            <div class="history-total">
                <span class="history-total-label">ยอดรวม</span>
                <span class="history-total-amount">${bill.total.toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿</span>
            </div>
        </div>
    `).join('');
}

function filterHistory() {
    let filtered = [...bills];
    
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const farmFilter = document.getElementById('historyFarmFilter').value;
    const sortBy = document.getElementById('historySortBy').value;
    
    if (searchTerm) {
        filtered = filtered.filter(bill => 
            bill.farmName.toLowerCase().includes(searchTerm) ||
            bill.date.includes(searchTerm) ||
            bill.id.includes(searchTerm)
        );
    }
    
    if (farmFilter) {
        filtered = filtered.filter(bill => bill.farmId === farmFilter);
    }
    
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'total-desc':
                return b.total - a.total;
            case 'total-asc':
                return a.total - b.total;
            default:
                return 0;
        }
    });
    
    return filtered;
}

function sortHistory() {
    renderHistory();
}

function viewBill(billId) {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
        currentBillId = billId;
        showBillPreview(bill);
    }
}

// ===== ASSET MANAGEMENT =====
function renderAssetList() {
    const container = document.getElementById('assetList');
    
    if (Object.keys(assets).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>ยังไม่มีสินค้าในระบบ</h3>
                <p>เริ่มเพิ่มสินค้าแรกของคุณได้เลย</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = Object.keys(assets).sort().map(type => `
        <div class="asset-type-section">
            <div class="asset-type-header">ประเภท ${type}</div>
            <table class="asset-list-table">
                <thead>
                    <tr>
                        <th style="width: 60%">ชื่อสินค้า</th>
                        <th style="width: 25%">ราคา (บาท)</th>
                        <th style="width: 15%"></th>
                    </tr>
                </thead>
                <tbody>
                    ${assets[type].map((asset, index) => `
                        <tr>
                            <td>${asset.name}</td>
                            <td style="text-align: right">${asset.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                            <td style="text-align: center">
                                <button class="icon-btn delete" onclick="deleteAsset('${type}', ${index})" title="ลบ">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('');
}

function addNewAsset() {
    const type = document.getElementById('newAssetType').value.trim();
    const name = document.getElementById('newAssetName').value.trim();
    const price = parseFloat(document.getElementById('newAssetPrice').value);
    
    if (!type || !name || isNaN(price) || price < 0) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }
    
    if (!assets[type]) {
        assets[type] = [];
    }
    
    assets[type].push({ name, price });
    saveAssets();
    renderAssetList();
    
    // ข้อ 6: ไม่ auto-download CSV อีกต่อไป
    // ผู้ใช้สามารถกดปุ่ม "ส่งออก CSV" ได้เอง
    
    document.getElementById('newAssetType').value = '';
    document.getElementById('newAssetName').value = '';
    document.getElementById('newAssetPrice').value = '';
    
    showToast('เพิ่มสินค้าเรียบร้อย', 'success');
    updateStats();
}

// ฟังก์ชันส่งออก CSV แยกต่างหาก
function saveAssetsToCSV() {
    let csv = '';
    
    Object.keys(assets).sort().forEach(type => {
        assets[type].forEach(asset => {
            csv += `${type},${asset.name},${asset.price}\n`;
        });
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Asset.txt';
    link.click();
    
    showToast('ส่งออก Asset.txt เรียบร้อย', 'success');
}

function deleteAsset(type, index) {
    if (!confirm('ต้องการลบสินค้านี้ใช่หรือไม่?')) return;
    
    assets[type].splice(index, 1);
    
    if (assets[type].length === 0) {
        delete assets[type];
    }
    
    saveAssets();
    renderAssetList();
    showToast('ลบสินค้าเรียบร้อย', 'success');
    updateStats();
}

function exportAssets() {
    let csv = 'ประเภท,ชื่อสินค้า,ราคา\n';
    
    Object.keys(assets).sort().forEach(type => {
        assets[type].forEach(asset => {
            csv += `${type},${asset.name},${asset.price}\n`;
        });
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'assets.csv';
    link.click();
    
    showToast('ส่งออกข้อมูลเรียบร้อย', 'success');
}

function importAssets(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        let imported = 0;
        
        lines.forEach((line, index) => {
            if (index === 0) return;
            
            const parts = line.trim().split(',');
            if (parts.length === 3) {
                const [type, name, price] = parts;
                if (type && name && price) {
                    if (!assets[type]) assets[type] = [];
                    assets[type].push({
                        name: name.trim(),
                        price: parseFloat(price)
                    });
                    imported++;
                }
            }
        });
        
        saveAssets();
        renderAssetList();
        showToast(`นำเข้า ${imported} รายการเรียบร้อย`, 'success');
        updateStats();
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// ===== SETTINGS PAGE =====
// ข้อ 7: UI จัดการฟาร์มแบบใหม่ - Table View
function renderFarmTable() {
    const container = document.getElementById('farmTableContainer');
    if (!container) return;
    
    let html = '<div class="farm-table-wrapper">';
    
    Object.keys(farms).forEach(farmId => {
        const farm = farms[farmId];
        html += `
            <div class="farm-table-item">
                <div class="farm-table-header">
                    <div class="farm-name-display">
                        <span class="farm-icon">🏭</span>
                        <strong>${farm.name}</strong>
                        <span class="pond-count-badge">${farm.ponds.length} บ่อ</span>
                    </div>
                    <button class="icon-btn" onclick="openFarmEditor('${farmId}')" title="แก้ไขชื่อฟาร์ม">✏️</button>
                </div>
                <div class="pond-list">
                    ${farm.ponds.map((pondName, idx) => `
                        <div class="pond-list-item">
                            <span class="pond-icon">🦐</span>
                            <span class="pond-name">${pondName}</span>
                            <div class="pond-actions">
                                <button class="icon-btn-small" onclick="editPondName('${farmId}', ${idx})" title="แก้ไข">✏️</button>
                                <button class="icon-btn-small delete" onclick="deletePondConfirm('${farmId}', ${idx})" title="ลบ">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn-secondary btn-add-pond" onclick="addPondToFarm('${farmId}')">
                        ➕ เพิ่มบ่อ
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function openFarmEditor(farmId) {
    const farm = farms[farmId];
    const newName = prompt('แก้ไขชื่อฟาร์ม:', farm.name);
    
    if (newName && newName.trim()) {
        farm.name = newName.trim();
        saveFarms();
        populateFarmSelects();
        renderFarmTable();
        showToast('แก้ไขชื่อฟาร์มเรียบร้อย', 'success');
    }
}

function editPondName(farmId, pondIndex) {
    const farm = farms[farmId];
    const oldName = farm.ponds[pondIndex];
    const newName = prompt('แก้ไขชื่อบ่อ:', oldName);
    
    if (newName && newName.trim()) {
        farm.ponds[pondIndex] = newName.trim();
        saveFarms();
        renderFarmTable();
        showToast('แก้ไขชื่อบ่อเรียบร้อย', 'success');
    }
}

function deletePondConfirm(farmId, pondIndex) {
    const farm = farms[farmId];
    
    if (farm.ponds.length <= 1) {
        showToast('ต้องมีอย่างน้อย 1 บ่อในแต่ละฟาร์ม', 'error');
        return;
    }
    
    const pondName = farm.ponds[pondIndex];
    if (confirm(`ต้องการลบ ${pondName} ใช่หรือไม่?`)) {
        farm.ponds.splice(pondIndex, 1);
        saveFarms();
        renderFarmTable();
        showToast('ลบบ่อเรียบร้อย', 'success');
    }
}

function addPondToFarm(farmId) {
    const farm = farms[farmId];
    const existingNumbers = farm.ponds.map(p => {
        const match = p.match(/บ่อที่ (\d+)/);
        return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0);
    
    let newNumber = 1;
    while (existingNumbers.includes(newNumber)) {
        newNumber++;
    }
    
    const newPondName = `บ่อที่ ${newNumber}`;
    farm.ponds.push(newPondName);
    farm.ponds.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });
    
    saveFarms();
    renderFarmTable();
    showToast(`เพิ่ม ${newPondName} เรียบร้อย`, 'success');
}

function loadManagePonds() {
    renderFarmTable();
}

function toggleNameEditor() {
    const editor = document.getElementById('nameEditorSection');
    const isVisible = editor.style.display !== 'none';
    
    if (isVisible) {
        editor.style.display = 'none';
    } else {
        editor.style.display = 'block';
        renderNameEditor();
    }
}

function renderNameEditor() {
    const content = document.getElementById('nameEditorContent');
    
    content.innerHTML = Object.keys(farms).map(farmId => {
        const farm = farms[farmId];
        return `
            <div class="farm-editor-section">
                <div class="form-group">
                    <label>🏭 ชื่อฟาร์ม</label>
                    <input type="text" class="input-field" value="${farm.name}" 
                           data-farm-id="${farmId}" data-type="farm">
                </div>
                <div class="form-group">
                    <label>🦐 บ่อทั้งหมด</label>
                    <div class="editor-grid">
                        ${farm.ponds.map((pond, index) => `
                            <input type="text" class="input-field" value="${pond}" 
                                   data-farm-id="${farmId}" data-pond-index="${index}" data-type="pond">
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function saveNameChanges() {
    const inputs = document.querySelectorAll('#nameEditorContent input');
    
    inputs.forEach(input => {
        const farmId = input.dataset.farmId;
        const type = input.dataset.type;
        
        if (type === 'farm') {
            farms[farmId].name = input.value;
        } else if (type === 'pond') {
            const pondIndex = parseInt(input.dataset.pondIndex);
            farms[farmId].ponds[pondIndex] = input.value;
        }
    });
    
    saveFarms();
    populateFarmSelects();
    loadManagePonds();
    toggleNameEditor();
    showToast('บันทึกการเปลี่ยนแปลงเรียบร้อย', 'success');
}

function resetToDefault() {
    if (!confirm('⚠️ ต้องการรีเซ็ตฟาร์มและบ่อทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถยกเลิกได้')) {
        return;
    }
    
    farms = {
        1: { name: "ฟาร์มที่ 1", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] },
        2: { name: "ฟาร์มที่ 2", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] },
        3: { name: "ฟาร์มที่ 3", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] },
        4: { name: "ฟาร์มที่ 4", ponds: ["บ่อที่ 1", "บ่อที่ 2", "บ่อที่ 3", "บ่อที่ 4"] }
    };
    
    saveFarms();
    populateFarmSelects();
    loadManagePonds();
    toggleNameEditor();
    showToast('รีเซ็ตเป็นค่าเริ่มต้นเรียบร้อย', 'success');
}

// ===== DATA BACKUP & RESTORE =====
function backupData() {
    const data = {
        farms: farms,
        assets: assets,
        bills: bills,
        version: '1.0',
        exportDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `farm-bill-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('สำรองข้อมูลเรียบร้อย', 'success');
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('⚠️ การกู้คืนข้อมูลจะเขียนทับข้อมูลปัจจุบัน\nต้องการดำเนินการต่อใช่หรือไม่?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.farms) farms = data.farms;
            if (data.assets) assets = data.assets;
            if (data.bills) bills = data.bills;
            
            saveFarms();
            saveAssets();
            saveBills();
            
            initializeUI();
            showToast('กู้คืนข้อมูลเรียบร้อย', 'success');
        } catch (error) {
            showToast('ไฟล์ไม่ถูกต้อง', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (!confirm('⚠️ ต้องการลบข้อมูลทั้งหมดใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถยกเลิกได้\n\n(แนะนำให้สำรองข้อมูลก่อน)')) {
        return;
    }
    
    if (!confirm('⚠️⚠️⚠️ ยืนยันอีกครั้ง: ลบข้อมูลทั้งหมด?')) {
        return;
    }
    
    localStorage.clear();
    location.reload();
}

function updateStats() {
    const totalAssetsCount = Object.values(assets).reduce((sum, arr) => sum + arr.length, 0);
    const totalBillsCount = bills.length;
    
    const totalAssetsEl = document.getElementById('totalAssets');
    const totalBillsEl = document.getElementById('totalBills');
    
    if (totalAssetsEl) totalAssetsEl.textContent = totalAssetsCount;
    if (totalBillsEl) totalBillsEl.textContent = totalBillsCount;
    
    // ข้อ 7: อัพเดท Farm Table
    renderFarmTable();
}

// ===== UTILITY FUNCTIONS =====
function formatThaiDate(dateStr) {
    const date = new Date(dateStr);
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    
    return `${day} ${month} ${year}`;
}

function showToast(message, type = 'info') {
    const existingToast = document.getElementById('toast');
    if (existingToast.classList.contains('show')) {
        existingToast.classList.remove('show');
        setTimeout(() => displayToast(message, type), 300);
    } else {
        displayToast(message, type);
    }
}

function showConfirm(message, onConfirm, onCancel = null) {
    const existingModal = document.getElementById('customConfirm');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'customConfirm';
    modal.className = 'custom-confirm-overlay';
    
    modal.innerHTML = `
        <div class="custom-confirm-box">
            <div class="confirm-icon">⚠️</div>
            <h3 class="confirm-title">ยืนยันการดำเนินการ</h3>
            <p class="confirm-message">${message}</p>
            <div class="confirm-actions">
                <button class="btn-confirm-yes">✓ ยืนยัน</button>
                <button class="btn-confirm-no">✕ ยกเลิก</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('show'), 10);
    
    const yesBtn = modal.querySelector('.btn-confirm-yes');
    const noBtn = modal.querySelector('.btn-confirm-no');
    
    yesBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            if (onConfirm) onConfirm();
        }, 300);
    };
    
    noBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            if (onCancel) onCancel();
        }, 300);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            noBtn.click();
        }
    };
}

function displayToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.pond-selector') && !e.target.closest('button[onclick*="togglePondSelector"]')) {
        document.querySelectorAll('.pond-selector').forEach(s => {
            s.style.display = 'none';
        });
    }
});