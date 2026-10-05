# API Specification - SMART RESTAURANT MANAGEMENT SYSTEM

All APIs return standard JSON response:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "error": null
}
```

## Endpoints List
- `POST /api/auth/login`: Authenticate and obtain HTTP-Only JWT session
- `GET /api/auth/me`: Fetch current active user session
- `POST /api/auth/me`: Logout user session
- `GET /api/branches`: Fetch branches list
- `GET /api/tables`: Fetch table layout and active order statuses
- `PATCH /api/tables/[id]`: Update table status (AVAILABLE, OCCUPIED, etc.)
- `GET /api/menu`: Fetch menu items and categories
- `POST /api/menu`: Create menu item
- `PUT /api/menu/[id]`: Update menu item
- `DELETE /api/menu/[id]`: Soft delete menu item
- `GET /api/orders`: Fetch orders
- `POST /api/orders`: Create new customer order with transaction & stock check
- `GET /api/orders/[id]`: Fetch single order details
- `GET /api/kitchen`: Fetch live kitchen orders (WAITING, COOKING, READY)
- `PATCH /api/kitchen`: Update kitchen order or order item status
- `POST /api/payments`: Complete order payment, release table, deduct BOM stock, issue receipt
- `GET /api/inventory`: Fetch stock items and low stock alerts
- `POST /api/inventory`: Perform stock transactions (IN, OUT, ADJUSTMENT)
- `GET /api/members`: Search and fetch members
- `POST /api/members`: Register new member
- `GET /api/discounts`: Validate discount code
- `GET /api/dashboard`: Fetch live dynamic KPIs and chart trends
- `GET /api/reports`: Fetch sales reports and payment breakdown
- `GET /api/users`: Admin user list
- `POST /api/users`: Admin create user
- `GET /api/realtime`: Server-Sent Events (SSE) live push stream
- `GET /api/customer/menu/[tableRef]?qr=...`: ตรวจ QR token แล้วโหลดร้าน สาขา โต๊ะ เมนู ตัวเลือก ส่วนลด และสต็อกพร้อมขายของสาขานั้น
- `GET /api/customer/menu/[tableRef]/[itemId]?qr=...`: รายละเอียดเมนูและตัวเลือกของสาขาที่ QR อนุญาต
- `GET /api/customer/orders?table=...&qr=...`: ประวัติ Order ของโต๊ะที่ยืนยันแล้ว
- `POST /api/customer/orders`: ตรวจ QR/โต๊ะ/สาขา/สถานะร้าน/เมนู/ตัวเลือก/สต็อก/ส่วนลด และสร้าง Order + OrderItems + อัปเดตโต๊ะใน transaction
- `POST /api/customer/requests`: สร้าง Staff Request หรือ Bill Request จาก QR ที่ยืนยันแล้ว
- `GET /api/customer/requests`: รายการ Staff/Bill Requests สำหรับพนักงานที่เข้าสู่ระบบ
- `PATCH /api/customer/requests`: อัปเดตคำขอโดยพนักงาน (Bill Request ปิดได้หลังระบบรับชำระเงิน)
- `GET|POST|DELETE /api/customer/favorites`: เมนูโปรดของผู้ใช้ที่เข้าสู่ระบบ
- `GET /api/customer/profile`: ข้อมูลบัญชีและสมาชิกที่ผูกกับอีเมล
- `GET /api/customer/discounts`: ตรวจโค้ดส่วนลดตามโต๊ะ/สาขาและยอดสั่ง

Customer APIs ไม่รับราคา/branchId/tableId ที่เชื่อจาก Client: ราคาและสาขาคำนวณจากฐานข้อมูลหลังตรวจ token ที่ผูกกับโต๊ะ ส่วน SSE สำหรับลูกค้าต้องส่ง table และ qr token และจะส่งเฉพาะ event ของโต๊ะนั้น
