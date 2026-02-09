/* ===============================
   รับข้อมูลจากหน้าหลัก
   =============================== */
window.addEventListener("message", (e) => {
    if (!e.data || e.data.type !== "PRINT_BILL") return;
    renderBill(e.data.billData);
});

/* ===============================
   Render bill (ใช้ HTML เดิม)
   =============================== */
function renderBill(billData) {
    const root = document.getElementById("bill-print-root");

    // ⚠️ ตรงนี้คุณสามารถ copy HTML template
    // จาก preview มาใส่ตรง ๆ ได้ 100%
    root.innerHTML = billData.printHTML;

    exportPDF(billData);
}

/* ===============================
   Export PDF (config เสถียร)
   =============================== */
function exportPDF(billData) {

    const element = document.querySelector(".bill-a4");

    const dateObj = new Date(billData.date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    const filename = `บิล_${billData.farmName}_${day}-${month}-${year}.pdf`;

    html2pdf().set({
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    }).from(element).save();
}
