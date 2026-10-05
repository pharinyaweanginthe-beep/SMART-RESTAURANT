import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: z.string().min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1, { message: "กรุณาระบุรายการอาหาร" }),
  quantity: z.number().int().positive({ message: "จำนวนต้องมากกว่า 0" }),
  specialNotes: z.string().optional(),
});

export const createOrderSchema = z.object({
  branchId: z.string().min(1, { message: "กรุณาระบุสาขา" }),
  tableId: z.string().min(1, { message: "กรุณาระบุโต๊ะ" }),
  customerName: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1, { message: "ต้องมีรายการอาหารอย่างน้อย 1 รายการ" }),
  specialNotes: z.string().optional(),
  discountCode: z.string().optional(),
});

export const customerOrderSchema = z.object({
  table: z.string().min(1),
  qr: z.string().min(1),
  customerName: z.string().trim().max(100).optional(),
  specialNotes: z.string().trim().max(500).optional(),
  discountCode: z.string().trim().max(40).optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1).max(99),
      specialNotes: z.string().trim().max(250).optional(),
      selectedOptionIds: z.array(z.string().min(1)).max(10).optional(),
    })
  ).min(1).max(50),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COOKING", "READY", "SERVED", "COMPLETED", "CANCELLED"]),
});

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(["PENDING", "COOKING", "READY", "SERVED", "CANCELLED"]),
});

export const paymentSchema = z.object({
  orderId: z.string().min(1, { message: "กรุณาระบุออเดอร์" }),
  paymentMethod: z.enum(["CASH", "QR_CODE", "CREDIT_CARD", "OTHER"]),
  amountPaid: z.number().positive({ message: "จำนวนเงินที่รับต้องมากกว่า 0" }),
  discountCode: z.string().optional(),
  memberPhone: z.string().optional(),
});

export const menuItemSchema = z.object({
  branchId: z.string().min(1),
  categoryId: z.string().min(1, { message: "กรุณาเลือกหมวดหมู่" }),
  name: z.string().min(1, { message: "กรุณากรอกชื่อเมนู" }),
  description: z.string().optional(),
  price: z.number().positive({ message: "ราคาต้องมากกว่า 0" }),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const inventoryTransactionSchema = z.object({
  inventoryId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  amount: z.number().positive({ message: "จำนวนต้องมากกว่า 0" }),
  note: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, { message: "กรุณากรอกชื่อ" }),
  email: z.string().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: z.string().min(6, { message: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" }),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "STAFF", "KITCHEN", "CUSTOMER"]),
  branchId: z.string().optional(),
});

export const memberSchema = z.object({
  name: z.string().min(1, { message: "กรุณากรอกชื่อสมาชิก" }),
  phone: z.string().min(9, { message: "หมายเลขโทรศัพท์ไม่ถูกต้อง" }),
  email: z.string().email().optional().or(z.literal("")),
});
