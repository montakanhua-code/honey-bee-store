# Honey Bee — Landing Page

เว็บไซต์ขายน้ำผึ้ง 2 สูตร พร้อมตะกร้าสินค้าและฟอร์มส่งคำสั่งซื้อไปยัง Google Sheets

## ไฟล์ในโปรเจกต์

- `index.html` — โครงสร้างหน้าเว็บ
- `style.css` — รูปแบบและ responsive design
- `script.js` — โหลดสินค้า ตะกร้า และส่งคำสั่งซื้อ
- `products.json` — ข้อมูลสินค้า
- `config.js` — URL ของ Google Apps Script
- `Code.gs` — โค้ด Google Apps Script สำหรับบันทึกคำสั่งซื้อ
- `images/` — ภาพสินค้า Honey Bee ที่สร้างไว้

## 1) ตั้งค่า Google Sheets

1. สร้าง Google Sheet ใหม่
2. เปิด Extensions → Apps Script
3. วางโค้ดจากไฟล์ `Code.gs` ลงใน Apps Script แล้ว Save
4. เลือก Deploy → New deployment
5. เลือกประเภท Web app
6. Execute as: Me
7. ตั้ง Who has access ให้เหมาะกับการใช้งานเว็บไซต์ (หากต้องการให้ผู้เข้าชมทั่วไปส่งคำสั่งซื้อได้ ต้องอนุญาตการเข้าถึงจากผู้ใช้ภายนอกตามตัวเลือกที่บัญชีแสดง)
8. กด Deploy และอนุญาตสิทธิ์
9. คัดลอก Web app URL ที่ลงท้ายด้วย `/exec`

> ใช้ Google Sheet ที่ผูกกับ Apps Script นี้เป็นชีตปลายทาง เพราะโค้ดใช้ `SpreadsheetApp.getActiveSpreadsheet()`.

## 2) ใส่ URL ในเว็บไซต์

เปิด `config.js` แล้วแทนที่ข้อความ `ใส่_WEB_APP_URL_ที่ลงท้ายด้วย_exec_ตรงนี้` ด้วย Web app URL ที่คัดลอกมา เช่น

```js
window.HONEY_BEE_CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
};
```

บันทึกไฟล์ก่อน Deploy เว็บไซต์

## 3) ทดสอบในเครื่อง

อย่าเปิด `index.html` ด้วยการดับเบิลคลิกเป็น `file://` เพราะเบราว์เซอร์อาจไม่อนุญาตให้โหลด `products.json` ให้รัน local web server ในโฟลเดอร์โปรเจกต์แทน เช่น

```bash
python -m http.server 8000
```

แล้วเปิด `http://localhost:8000`

## 4) อัปโหลด GitHub

1. สร้าง repository ใหม่บน GitHub เช่น `honey-bee-website`
2. อัปโหลดไฟล์และโฟลเดอร์ทั้งหมดในโปรเจกต์นี้
3. Commit และ push

## 5) Deploy ด้วย Vercel

1. เข้าสู่ Vercel และเลือก Add New → Project
2. Import Git Repository จาก GitHub
3. เลือก repository `honey-bee-website`
4. Framework Preset: Other
5. Build Command และ Output Directory ปล่อยว่างได้ (เป็น static site)
6. กด Deploy
7. เปิด URL ที่ Vercel ให้มาเพื่อทดสอบเว็บไซต์

เมื่อ push การแก้ไขไปยัง branch ที่เชื่อมไว้ Vercel จะ Deploy ใหม่อัตโนมัติ

## หมายเหตุเรื่องการส่งฟอร์ม

หน้าเว็บส่ง JSON string ผ่าน POST โดยใช้ `Content-Type: text/plain;charset=utf-8` เพื่อหลีกเลี่ยง CORS preflight และ Apps Script อ่านจาก `e.postData.contents` ได้ตามปกติ

ตัวอย่าง payload:

```json
{
  "customerName": "ลูกค้าทดลอง",
  "contact": "0812345678",
  "items": "น้ำผึ้งดอกลำไย (250ml) x 1 = ฿129",
  "total": 129,
  "note": "ทดสอบระบบ"
}
```

เนื่องจากเบราว์เซอร์ใช้ `mode: "no-cors"` จึงอ่านผลตอบกลับจาก Apps Script ไม่ได้ หน้าเว็บจะแสดงว่าได้ส่งคำขอแล้ว แต่ควรตรวจสอบ Google Sheets ว่ามีแถวใหม่จริงก่อนเปิดรับออเดอร์ หากต้องการสถานะสำเร็จ/ล้มเหลวแบบยืนยันได้ ควรเพิ่ม backend proxy หรือออกแบบ endpoint ที่รองรับ CORS อย่างเหมาะสม

## ก่อนเปิดใช้งานจริง

- ตรวจสอบราคา รูปสินค้า และรายละเอียดให้ตรงกับสินค้าจริง
- ใส่ช่องทางติดต่อและนโยบายจัดส่ง/ชำระเงินของร้าน
- ทดสอบการสั่งซื้อจาก URL Vercel และตรวจสอบแถวใน Google Sheets
- อย่าเก็บข้อมูลบัตรเครดิตหรือข้อมูลลับใน Google Sheets
- เพิ่มมาตรการป้องกันสแปมและตรวจสอบข้อมูลฝั่ง server ก่อนใช้งานจริง
