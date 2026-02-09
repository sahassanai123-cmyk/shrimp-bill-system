#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Asset Manager for Farm Billing System
แก้ไข/เพิ่ม/ลบ ไฟล์ Asset.txt ได้ง่ายๆ
"""

import csv
import os

class AssetManager:
    def __init__(self, filename='Asset.txt'):
        self.filename = filename
        self.assets = []
        self.load()
    
    def load(self):
        """โหลดข้อมูลจากไฟล์"""
        if os.path.exists(self.filename):
            with open(self.filename, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                self.assets = [row for row in reader if len(row) == 3]
            print(f"โหลดข้อมูล {len(self.assets)} รายการ")
        else:
            print(f"ไม่พบไฟล์ {self.filename}")
    
    def save(self):
        """บันทึกข้อมูลลงไฟล์"""
        with open(self.filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(self.assets)
        print(f"บันทึก {len(self.assets)} รายการเรียบร้อย")
    
    def list_all(self):
        """แสดงรายการทั้งหมด"""
        print(f"\n{'ID':<5} {'ประเภท':<10} {'ชื่อสินค้า':<30} {'ราคา':>10}")
        print("-" * 60)
        for i, (type, name, price) in enumerate(self.assets):
            print(f"{i:<5} {type:<10} {name:<30} {price:>10}")
        print(f"\nรวม: {len(self.assets)} รายการ\n")
    
    def add(self, type, name, price):
        """เพิ่มสินค้า"""
        self.assets.append([type, name, str(price)])
        self.save()
        print(f"✅ เพิ่ม: {type} | {name} | {price}")
    
    def update(self, index, type=None, name=None, price=None):
        """แก้ไขสินค้า"""
        if 0 <= index < len(self.assets):
            old = self.assets[index].copy()
            if type is not None:
                self.assets[index][0] = type
            if name is not None:
                self.assets[index][1] = name
            if price is not None:
                self.assets[index][2] = str(price)
            self.save()
            print(f"✅ แก้ไข ID {index}:")
            print(f"   เดิม: {old}")
            print(f"   ใหม่: {self.assets[index]}")
        else:
            print(f"❌ ไม่พบ ID {index}")
    
    def delete(self, index):
        """ลบสินค้า"""
        if 0 <= index < len(self.assets):
            deleted = self.assets.pop(index)
            self.save()
            print(f"✅ ลบ: {deleted}")
        else:
            print(f"❌ ไม่พบ ID {index}")
    
    def search(self, keyword):
        """ค้นหาสินค้า"""
        results = [(i, a) for i, a in enumerate(self.assets) 
                   if keyword.lower() in a[1].lower()]
        
        if results:
            print(f"\nพบ {len(results)} รายการ:")
            print(f"{'ID':<5} {'ประเภท':<10} {'ชื่อสินค้า':<30} {'ราคา':>10}")
            print("-" * 60)
            for i, (type, name, price) in results:
                print(f"{i:<5} {type:<10} {name:<30} {price:>10}")
        else:
            print(f"❌ ไม่พบ '{keyword}'")
    
    def filter_by_type(self, type):
        """กรองตามประเภท"""
        results = [(i, a) for i, a in enumerate(self.assets) if a[0] == type]
        
        if results:
            print(f"\nประเภท {type}: {len(results)} รายการ")
            for i, (t, name, price) in results:
                print(f"  {i}: {name} - {price} บาท")
        else:
            print(f"❌ ไม่พบประเภท {type}")

def main():
    """เมนูหลัก"""
    am = AssetManager()
    
    while True:
        print("\n" + "="*60)
        print("🐟 Asset Manager - ระบบจัดการสินค้า")
        print("="*60)
        print("1. แสดงรายการทั้งหมด")
        print("2. เพิ่มสินค้า")
        print("3. แก้ไขสินค้า")
        print("4. ลบสินค้า")
        print("5. ค้นหาสินค้า")
        print("6. กรองตามประเภท")
        print("0. ออก")
        
        choice = input("\nเลือกเมนู: ").strip()
        
        if choice == '1':
            am.list_all()
        
        elif choice == '2':
            type = input("ประเภท (001-999): ")
            name = input("ชื่อสินค้า: ")
            price = input("ราคา: ")
            am.add(type, name, price)
        
        elif choice == '3':
            am.list_all()
            index = int(input("ID ที่ต้องการแก้ไข: "))
            print("\n(กด Enter เพื่อข้าม)")
            type = input("ประเภทใหม่: ").strip() or None
            name = input("ชื่อใหม่: ").strip() or None
            price = input("ราคาใหม่: ").strip() or None
            am.update(index, type, name, price)
        
        elif choice == '4':
            am.list_all()
            index = int(input("ID ที่ต้องการลบ: "))
            confirm = input(f"ยืนยันลบ ID {index}? (y/n): ")
            if confirm.lower() == 'y':
                am.delete(index)
        
        elif choice == '5':
            keyword = input("คำค้นหา: ")
            am.search(keyword)
        
        elif choice == '6':
            type = input("ประเภท (001-999): ")
            am.filter_by_type(type)
        
        elif choice == '0':
            print("\nบายบาย! 👋")
            break
        
        else:
            print("❌ เลือกเมนูไม่ถูกต้อง")

if __name__ == '__main__':
    main()