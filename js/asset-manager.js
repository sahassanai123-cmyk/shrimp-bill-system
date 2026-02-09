#!/usr/bin/env node
/**
 * Asset Manager for Farm Billing System (Node.js)
 * แก้ไข/เพิ่ม/ลบ ไฟล์ Asset.txt
 */

const fs = require('fs');
const readline = require('readline');

class AssetManager {
    constructor(filename = 'Asset.txt') {
        this.filename = filename;
        this.assets = [];
        this.load();
    }
    
    load() {
        if (fs.existsSync(this.filename)) {
            const data = fs.readFileSync(this.filename, 'utf-8');
            this.assets = data.split('\n')
                .filter(line => line.trim())
                .map(line => line.split(','))
                .filter(row => row.length === 3);
            console.log(`โหลดข้อมูล ${this.assets.length} รายการ`);
        } else {
            console.log(`ไม่พบไฟล์ ${this.filename}`);
        }
    }
    
    save() {
        const data = this.assets.map(row => row.join(',')).join('\n');
        fs.writeFileSync(this.filename, data, 'utf-8');
        console.log(`✅ บันทึก ${this.assets.length} รายการเรียบร้อย`);
    }
    
    listAll() {
        console.log(`\n${'ID'.padEnd(5)} ${'ประเภท'.padEnd(10)} ${'ชื่อสินค้า'.padEnd(30)} ${'ราคา'.padStart(10)}`);
        console.log('-'.repeat(60));
        this.assets.forEach(([type, name, price], i) => {
            console.log(`${String(i).padEnd(5)} ${type.padEnd(10)} ${name.padEnd(30)} ${price.padStart(10)}`);
        });
        console.log(`\nรวม: ${this.assets.length} รายการ\n`);
    }
    
    add(type, name, price) {
        this.assets.push([type, name, price]);
        this.save();
        console.log(`✅ เพิ่ม: ${type} | ${name} | ${price}`);
    }
    
    update(index, type, name, price) {
        if (index >= 0 && index < this.assets.length) {
            const old = [...this.assets[index]];
            if (type) this.assets[index][0] = type;
            if (name) this.assets[index][1] = name;
            if (price) this.assets[index][2] = price;
            this.save();
            console.log(`✅ แก้ไข ID ${index}:`);
            console.log(`   เดิม: ${old}`);
            console.log(`   ใหม่: ${this.assets[index]}`);
        } else {
            console.log(`❌ ไม่พบ ID ${index}`);
        }
    }
    
    delete(index) {
        if (index >= 0 && index < this.assets.length) {
            const deleted = this.assets.splice(index, 1)[0];
            this.save();
            console.log(`✅ ลบ: ${deleted}`);
        } else {
            console.log(`❌ ไม่พบ ID ${index}`);
        }
    }
    
    search(keyword) {
        const results = this.assets
            .map((a, i) => [i, a])
            .filter(([i, a]) => a[1].toLowerCase().includes(keyword.toLowerCase()));
        
        if (results.length > 0) {
            console.log(`\nพบ ${results.length} รายการ:`);
            results.forEach(([i, [type, name, price]]) => {
                console.log(`  ${i}: ${type} | ${name} | ${price}`);
            });
        } else {
            console.log(`❌ ไม่พบ '${keyword}'`);
        }
    }
}

// ใช้งานแบบ CLI
const am = new AssetManager();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log('\n' + '='.repeat(60));
    console.log('🦐 Asset Manager - ระบบจัดการสินค้า');
    console.log('='.repeat(60));
    console.log('1. แสดงรายการทั้งหมด');
    console.log('2. เพิ่มสินค้า');
    console.log('3. แก้ไขสินค้า');
    console.log('4. ลบสินค้า');
    console.log('5. ค้นหาสินค้า');
    console.log('0. ออก');
}

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    while (true) {
        showMenu();
        const choice = await askQuestion('\nเลือกเมนู: ');
        
        if (choice === '1') {
            am.listAll();
        } else if (choice === '2') {
            const type = await askQuestion('ประเภท (001-999): ');
            const name = await askQuestion('ชื่อสินค้า: ');
            const price = await askQuestion('ราคา: ');
            am.add(type, name, price);
        } else if (choice === '3') {
            am.listAll();
            const index = parseInt(await askQuestion('ID ที่ต้องการแก้ไข: '));
            const type = await askQuestion('ประเภทใหม่ (Enter เพื่อข้าม): ');
            const name = await askQuestion('ชื่อใหม่ (Enter เพื่อข้าม): ');
            const price = await askQuestion('ราคาใหม่ (Enter เพื่อข้าม): ');
            am.update(index, type || null, name || null, price || null);
        } else if (choice === '4') {
            am.listAll();
            const index = parseInt(await askQuestion('ID ที่ต้องการลบ: '));
            const confirm = await askQuestion(`ยืนยันลบ ID ${index}? (y/n): `);
            if (confirm.toLowerCase() === 'y') {
                am.delete(index);
            }
        } else if (choice === '5') {
            const keyword = await askQuestion('คำค้นหา: ');
            am.search(keyword);
        } else if (choice === '0') {
            console.log('\nบายบาย! 👋');
            rl.close();
            break;
        }
    }
}

main();