import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EVENT_BILL_REQUEST,
  EVENT_STAFF_REQUEST,
  realtimeHub,
} from "@/lib/realtime";
import { resolveCustomerTable } from "@/services/customer.service";

export const dynamic = "force-dynamic";

const customerRequestSchema = z.object({
  table: z.string().min(1),
  qr: z.string().min(1),
  type: z.enum(["CALL_STAFF", "WATER", "CUTLERY", "BILL"]),
  orderId: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = customerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const table = await resolveCustomerTable(parsed.data.table, parsed.data.qr);
  if (!table) {
    return NextResponse.json({ success: false, error: "QR Code ไม่ถูกต้องหรือไม่พบโต๊ะนี้" }, { status: 404 });
  }

  if (parsed.data.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, tableId: table.id, paymentStatus: "UNPAID" },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "ไม่พบออเดอร์ที่ยังค้างชำระของโต๊ะนี้" }, { status: 404 });
    }
  }

  if (parsed.data.type === "BILL") {
    const existing = await prisma.billRequest.findFirst({
      where: { tableId: table.id, status: { in: ["REQUESTED", "PROCESSING"] } },
    });
    if (existing) return NextResponse.json({ success: true, data: existing });

    const billRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.billRequest.create({
        data: { branchId: table.branchId, tableId: table.id, orderId: parsed.data.orderId },
        include: { table: true },
      });
      await tx.table.update({ where: { id: table.id }, data: { status: "WAITING_PAYMENT" } });
      return created;
    });
    realtimeHub.emit(EVENT_BILL_REQUEST, billRequest);
    return NextResponse.json({ success: true, data: billRequest }, { status: 201 });
  }

  const staffRequest = await prisma.staffRequest.create({
    data: {
      branchId: table.branchId,
      tableId: table.id,
      orderId: parsed.data.orderId,
      type: parsed.data.type,
    },
    include: { table: true },
  });
  realtimeHub.emit(EVENT_STAFF_REQUEST, staffRequest);
  return NextResponse.json({ success: true, data: staffRequest }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER", "CASHIER", "STAFF"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ดูคำขอ" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const branchId =
    session.role === "ADMIN"
      ? searchParams.get("branchId") || undefined
      : session.branchId || "__unassigned__";
  const [staffRequests, billRequests] = await Promise.all([
    prisma.staffRequest.findMany({
      where: { ...(branchId ? { branchId } : {}), status: { in: ["REQUESTED", "PROCESSING"] } },
      include: { table: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.billRequest.findMany({
      where: { ...(branchId ? { branchId } : {}), status: { in: ["REQUESTED", "PROCESSING"] } },
      include: { table: true, order: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return NextResponse.json({ success: true, data: { staffRequests, billRequests } });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER", "CASHIER", "STAFF"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์แก้ไขคำขอ" }, { status: 403 });
  }
  const schema = z.object({
    requestId: z.string().min(1),
    kind: z.enum(["STAFF", "BILL"]),
    status: z.enum(["PROCESSING", "COMPLETED", "CANCELLED"]),
  });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  if (parsed.data.kind === "STAFF") {
    const result = await prisma.staffRequest.updateMany({
      where: {
        id: parsed.data.requestId,
        ...(session.role === "ADMIN" ? {} : { branchId: session.branchId || "__unassigned__" }),
      },
      data: { status: parsed.data.status },
    });
    if (!result.count) return NextResponse.json({ success: false, error: "ไม่พบคำขอ" }, { status: 404 });
    const updatedRequest = await prisma.staffRequest.findUnique({
      where: { id: parsed.data.requestId },
      include: { table: true },
    });
    if (updatedRequest) realtimeHub.emit(EVENT_STAFF_REQUEST, updatedRequest);
  } else {
    if (parsed.data.status === "COMPLETED") {
      const paidBill = await prisma.billRequest.findFirst({
        where: {
          id: parsed.data.requestId,
          status: "PAID",
          ...(session.role === "ADMIN" ? {} : { branchId: session.branchId || "__unassigned__" }),
        },
        select: { id: true },
      });
      if (!paidBill) {
        return NextResponse.json({ success: false, error: "ปิดคำขอได้หลังรับชำระเงินแล้วเท่านั้น" }, { status: 409 });
      }
    }
    const result = await prisma.billRequest.updateMany({
      where: {
        id: parsed.data.requestId,
        ...(session.role === "ADMIN" ? {} : { branchId: session.branchId || "__unassigned__" }),
      },
      data: { status: parsed.data.status },
    });
    if (!result.count) return NextResponse.json({ success: false, error: "ไม่พบคำขอ" }, { status: 404 });
    const updatedRequest = await prisma.billRequest.findUnique({
      where: { id: parsed.data.requestId },
      include: { table: true },
    });
    if (updatedRequest) realtimeHub.emit(EVENT_BILL_REQUEST, updatedRequest);
  }
  return NextResponse.json({ success: true });
}
