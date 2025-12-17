# การนำขึ้นระบบ Vercel (Deploy to Vercel)

Vercel เป็นแพลตฟอร์มที่เหมาะสมที่สุดสำหรับ Next.js Application เนื่องจาก:

1. **ใช้งานง่าย**: เชื่อมต่อกับ GitHub แล้ว Deploy ได้ทันที
2. **รวดเร็ว**: มีระบบ CDN ทั่วโลก ทำให้เข้าเว็บได้เร็วจากทุกที่
3. **ฟรี**: สำหรับการใช้งานทั่วไป (Hobby Plan)

## ขั้นตอนการ Deploy

### 1. เตรียม Code ขึ้น GitHub

ตรวจสอบว่า Code ล่าสุดถูก Push ขึ้น GitHub Repository แล้ว

### 2. สมัคร/เข้าสู่ระบบ Vercel

ไปที่ [vercel.com](https://vercel.com) และ Login ด้วย GitHub Account

### 3. Import Project

1. กดปุ่ม **"Add New..."** > **"Project"**
2. เลือก Repository `SmartLab-BloodCellQualityTesting` ของคุณ
3. กด **Import**

### 4. ตั้งค่า Project (Configure Project)

Vercel จะตรวจจับว่าเป็น Next.js โดยอัตโนมัติ

- **Framework Preset**: Next.js
- **Root Directory**: `app` (สำคัญ! ต้องเลือก folder `app` เพราะ code อยู่ในนั้น)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 5. Deploy

กดปุ่ม **Deploy** และรอสักครู่
เมื่อเสร็จสิ้น คุณจะได้รับ URL (เช่น `smartlab-app.vercel.app`) ที่สามารถส่งให้ทุกคนใช้งานได้ทันที

## หมายเหตุ

- ระบบได้ถูกปรับปรุงให้รองรับการอ่านไฟล์ CSV บน Vercel แล้ว (ย้ายข้อมูลไปที่ `app/data`)
- หากมีการอัปเดต Code ใน GitHub ระบบ Vercel จะทำการ Deploy เวอร์ชันใหม่ให้อัตโนมัติ
