# SMART RESTAURANT MANAGEMENT SYSTEM
### ระบบบริหารจัดการร้านอาหารอัจฉริยะ (Enterprise SaaS Web Application)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/pharinyaweanginthe-beep/SMART-RESTAURANT)

ระบบบริหารจัดการร้านอาหารแบบครบวงจร ใช้งานได้จริง เชื่อมต่อ Customer QR Ordering → POS Cashier → Kitchen KDS → Inventory BOM Recipe → Dashboard → Reports → Investment Financial Module

---

## 🚀 Key Features (ฟังก์ชันหลักในระบบ)

1. **Customer QR Ordering System (`/menu/[tableId]`)**
   - สแกน QR ประจำโต๊ะเพื่อเปิดเมนูของร้าน/สาขานั้นโดยตรง มี QR token ยืนยันโต๊ะฝั่ง Server
   - ค้นหา/กรองเมนู เลือกตัวเลือกและหมายเหตุ จัดการตะกร้า ใส่โค้ดส่วนลด และส่งออเดอร์จริงเข้าฐานข้อมูล
   - ดูสถานะออเดอร์และประวัติโต๊ะ เรียกพนักงาน/ขอน้ำ/ช้อนส้อม/เช็คบิลได้โดยไม่ต้องสมัครสมาชิก
   - คำนวณราคา ตรวจสอบสต็อกวัตถุดิบล่วงหน้า และบันทึกออเดอร์เข้าฐานข้อมูลจริง

2. **Real-Time Order Tracking (`/order/[orderId]`)**
   - ลูกค้าสามารถติดตามสถานะออเดอร์แบบเรียลไทม์ (รับออเดอร์ → กำลังปรุง → อาหารพร้อม → กำลังเสิร์ฟ → เสร็จสิ้น)

3. **POS & Cashier Payment System (`/pos`)**
   - สำหรับแคชเชียร์ เลือกโต๊ะ ค้นหาเมนู คำนวณยอดรวม ภาษี และส่วนลด (Discount Code)
   - รองรับการชำระเงินหลายรูปแบบ (เงินสด, QR Code, บัตรเครดิต)
   - สะสมแต้มสมาชิกอัตโนมัติ (1 แต้ม ต่อทุกๆ ฿50)
   - ตัดสต็อกวัตถุดิบลำดับถัดไป คืนสถานะโต๊ะเป็นว่าง และพิมพ์ใบเสร็จรับเงิน (Printable Receipt)

4. **Kitchen Display System - KDS (`/kitchen`)**
   - จอแสดงผลห้องครัวแยก 3 คอลัมน์ (WAITING / COOKING / READY)
   - อัปเดตออเดอร์เข้าทันทีผ่าน Server-Sent Events (SSE Real-Time Push)
   - ปุ่มเปลี่ยนสถานะ: "เริ่มทำ", "เสร็จแล้ว", "เรียกเสิร์ฟ"

5. **Table Management & QR Generator (`/tables`)**
   - ผังโต๊ะอาหาร แสดงสีสถานะชัดเจน (AVAILABLE, OCCUPIED, WAITING_PAYMENT, RESERVED, OUT_OF_SERVICE)
   - สร้าง และดาวน์โหลด QR Code ประจำโต๊ะสำหรับสั่งอาหาร

6. **Inventory & BOM Recipe Stock Deduction (`/inventory`)**
   - จัดการวัตถุดิบ บันทึกรับเข้า (Stock IN), เบิกออก (Stock OUT), และปรับยอด (ADJUSTMENT)
   - ระบบแจ้งเตือนวัตถุดิบใกล้หมด (Low Stock Alert) เมื่อคงเหลือน้อยกว่าเกณฑ์ขั้นต่ำ (Min Stock)
   - ตัดสต็อกอัตโนมัติตามสูตรอาหาร (Bill of Materials - BOM) เมื่อขายสินค้า

7. **Executive Dashboard (`/dashboard`)**
   - แสดงยอดขายวันนี้ จำนวนออเดอร์ ยอดเฉลี่ยต่อบิล (AOV) อัตราครองโต๊ะ และสต็อกเตือน
   - กราฟแนวโน้มยอดขายย้อนหลัง (Recharts Area Chart) และอันดับเมนูขายดี

8. **Sales & Financial Reports (`/reports`)**
   - กรองรายงานตามช่วงเวลา (วันนี้, เมื่อวาน, 7 วัน, 30 วัน)
   - แยกรายได้ตามช่องทางชำระเงิน
   - ปุ่ม Export ข้อมูลเป็นไฟล์ CSV

9. **Investment & Financial Model Module (`/investment`)**
   - นำเสนอเป้าหมายยอดขาย ฿28,000,000 ("Sales Target — สมมติฐานเพื่อการนำเสนอ")
   - แยก Revenue - Cost - Expense = Net Profit
   - สัดส่วนจัดสรรผลตอบแทน Investor 75% / Developer 25% ตามกำไรสุทธิที่จัดสรรได้จริง

10. **Role-Based Access Control (RBAC) & Multi-Branch (`/admin/users`, `/admin/branches`)**
    - กำหนดสิทธิ์ผู้ใช้: ADMIN, MANAGER, CASHIER, KITCHEN, STAFF, CUSTOMER
    - รองรับการบริหารหลายสาขา (Multi-Branch)

---

## 🛠️ Installation & Setup (การติดตั้งและการเปิดใช้งาน)

### 1. Prerequisites
- Node.js (v18.x หรือ v20.x+)
- npm / npx

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
สร้างไฟล์ `.env` โดยคัดลอกจาก `.env.example`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-unique-secret-of-at-least-32-random-bytes"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
สร้างค่า `AUTH_SECRET` สำหรับเครื่องของคุณด้วยคำสั่งนี้ แล้วนำผลลัพธ์ไปแทนค่าตัวอย่างใน `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
ห้ามใช้ secret ตัวอย่างหรือบัญชีเดโมใน Production และอย่า commit ไฟล์ `.env`

### 4. Database Setup & Seed Data
เตรียมฐานข้อมูลและข้อมูลตัวอย่างสำหรับเดโม:
```bash
npm run setup:demo
```
> **คำเตือน:** คำสั่งนี้จะลบข้อมูลเดิมในฐานข้อมูลที่ระบุใน `DATABASE_URL` แล้วสร้างข้อมูลเดโมใหม่ ใช้กับฐานข้อมูลเดโม/ฐานข้อมูลว่างเท่านั้น

เพิ่มเมนูเดโมในฐานข้อมูลเดิมโดยไม่ลบข้อมูล:
```bash
npm run seed:demo-menus
```
คำสั่งนี้เติมเมนูของสาขา `BR-001` เฉพาะหมวดที่มีน้อยกว่า 10 รายการ และสามารถรันซ้ำได้โดยไม่เพิ่มรายการซ้ำ

เมนูเดโมใช้ภาพอาหารที่เก็บไว้ใน `public/menu-items` จึงไม่ต้องพึ่งบริการรูปภาพภายนอกขณะเปิดร้าน หากนำระบบไปใช้กับร้านจริง ให้เปลี่ยนเป็นภาพอาหารและโลโก้ที่ร้านมีสิทธิ์ใช้งานได้จากหน้า **จัดการเมนู** ภาพเดโมเป็นภาพประกอบและอาจไม่ตรงกับจานที่ร้านเสิร์ฟ

### 5. Start Development Server
```bash
npm run dev
```
เปิดบราวเซอร์ที่ [http://localhost:3000](http://localhost:3000)

หรือเปิดโปรเจกต์ใน VS Code แล้วกด **F5** เพื่อเริ่ม Next.js และเปิดเบราว์เซอร์อัตโนมัติ (ต้องเตรียม `.env` และฐานข้อมูลตามขั้นตอนข้างต้นก่อน)

### ทดลอง Customer Menu
สาขาหลักในข้อมูลเดโมเปิดรับออเดอร์ตลอดวัน เพื่อให้ทดลองสั่งอาหารได้ทุกเวลา
1. เข้าสู่ระบบพนักงานที่ `/login` แล้วเปิด **Tables** เพื่อดูหรือดาวน์โหลด QR Code ของโต๊ะ (ต้องพิมพ์ QR ใหม่หลังอัปเดตระบบ เพราะ QR แบบเก่าไม่มี token)
2. สแกน QR Code ที่โต๊ะ หรือเปิด URL รูปแบบ `/menu/01?qr=<QR_TOKEN>` เพื่อดูเมนูสาขาที่ผูกกับโต๊ะ
3. เลือกอาหาร → เพิ่มลงตะกร้า → ตรวจสอบรายการ → ยืนยันการสั่ง ระบบจะสร้าง Order จริงและส่งแจ้งเตือนให้ Kitchen/Staff
4. ใช้แท็บ **รายการสั่ง** เพื่อติดตามสถานะ และปุ่ม **เรียกเช็คบิล** เพื่อสร้าง Bill Request ให้แคชเชียร์

ห้ามนำ `QR_TOKEN` ไปเผยแพร่สาธารณะนอก QR ที่โต๊ะ และอย่าใช้บัญชี/ข้อมูลเดโมกับ Production

---

## 🧪 Testing (การทดสอบระบบ)

รันตรวจรูปแบบโค้ดและชุดทดสอบด้วย ESLint และ Vitest:
```bash
npm run lint
npm test
```

---

## 🔐 Demo Accounts (บัญชีตัวอย่าง)
บัญชีพนักงานที่สร้างจาก seed จะถูกปิดใช้งานไว้โดยค่าเริ่มต้น และไม่สามารถเข้าสู่ระบบได้
ก่อนเปิดใช้จริง ให้ผู้ดูแลระบบสร้าง/เปิดบัญชีพนักงานด้วยรหัสผ่านเฉพาะของร้าน และห้ามเปิดใช้บัญชีเดโมบนเว็บสาธารณะ

---

## 📦 Production Build & Deployment

```bash
npm run build
npm start
```
ต้องการลิงก์สาธารณะถาวรให้ deploy ผ่าน Render Blueprint ที่ [render.yaml](./render.yaml) (ต้องใช้แพ็กเกจที่รองรับ persistent disk และมีค่าใช้จ่าย) ขั้นตอน deploy และการเข้าสู่ระบบครั้งแรกอยู่ที่ [docs/deployment.md](./docs/deployment.md)
