import { prisma } from "@/lib/prisma";
import { deductInventoryForOrder } from "./inventory.service";
import {
  realtimeHub,
  EVENT_BILL_REQUEST,
  EVENT_ORDER_UPDATED,
  EVENT_TABLE_UPDATED,
} from "@/lib/realtime";

export interface ProcessPaymentParams {
  orderId: string;
  paymentMethod: "CASH" | "QR_CODE" | "CREDIT_CARD" | "OTHER";
  amountPaid: number;
  discountCode?: string;
  memberPhone?: string;
  userId?: string;
}

export async function processPayment(params: ProcessPaymentParams) {
  // 1. Fetch Order details
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      orderItems: { include: { menuItem: true } },
      table: true,
      branch: true,
    },
  });

  if (!order) throw new Error("ไม่พบออเดอร์ในระบบ");
  if (order.paymentStatus === "PAID") throw new Error("ออเดอร์นี้ได้รับการชำระเงินเรียบร้อยแล้ว");

  let netAmount = order.netAmount;
  let discountAmount = order.discountAmount;
  let discountId = order.discountId;

  // Handle discount code if applied during payment checkout
  if (params.discountCode && !order.discountId) {
    const discount = await prisma.discount.findUnique({
      where: { code: params.discountCode.toUpperCase() },
    });

    if (discount && discount.status === "ACTIVE" && order.subtotal >= discount.minPurchase) {
      discountId = discount.id;
      if (discount.type === "PERCENTAGE") {
        discountAmount = (order.subtotal * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }
      netAmount = Math.max(0, order.subtotal - discountAmount);

      await prisma.discount.update({
        where: { id: discount.id },
        data: { usageCount: { increment: 1 } },
      });
    }
  }

  if (params.amountPaid < netAmount) {
    throw new Error(`จำนวนเงินที่รับ (฿${params.amountPaid}) น้อยกว่ายอดรวมสุทธิ (฿${netAmount})`);
  }

  const changeAmount = params.amountPaid - netAmount;

  // Handle Member point logic
  let customerId = order.customerId;
  if (params.memberPhone) {
    const customer = await prisma.customer.findUnique({
      where: { phone: params.memberPhone },
    });

    if (customer) {
      customerId = customer.id;
      // Calculate points: 1 point for every 50 Baht
      const earnedPoints = Math.floor(netAmount / 50);

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          points: { increment: earnedPoints },
          totalSpending: { increment: netAmount },
        },
      });

      await prisma.memberPoint.create({
        data: {
          customerId: customer.id,
          points: earnedPoints,
          transactionType: "EARN",
          orderId: order.id,
          note: `ได้รับแต้มสะสมจากออเดอร์ #${order.orderNumber}`,
        },
      });
    }
  }

  // Database Transaction for Atomic Payment Processing
  const paymentResult = await prisma.$transaction(async (tx) => {
    // A. Create Payment Record
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        paymentMethod: params.paymentMethod,
        amountPaid: params.amountPaid,
        changeAmount,
        transactionRef: `TXN-${Date.now()}`,
        status: "SUCCESS",
      },
    });

    // B. Update Order Status to COMPLETED and PAID
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
        discountAmount,
        discountId,
        netAmount,
        customerId,
      },
    });

    // C. Release Table to AVAILABLE
    await tx.table.update({
      where: { id: order.tableId },
      data: { status: "AVAILABLE" },
    });
    await tx.billRequest.updateMany({
      where: {
        tableId: order.tableId,
        status: { in: ["REQUESTED", "PROCESSING"] },
        OR: [{ orderId: order.id }, { orderId: null }],
      },
      data: { status: "PAID" },
    });

    return { payment, updatedOrder };
  });

  // D. Deduct Inventory Stock based on Recipe BOM
  await deductInventoryForOrder(order.id, params.userId);

  // E. Broadcast Real-time Events
  realtimeHub.emit(EVENT_ORDER_UPDATED, paymentResult.updatedOrder);
  realtimeHub.emit(EVENT_TABLE_UPDATED, { tableId: order.tableId, status: "AVAILABLE" });
  const paidBillRequest = await prisma.billRequest.findFirst({
    where: {
      tableId: order.tableId,
      OR: [{ orderId: order.id }, { orderId: null }],
      status: "PAID",
    },
    include: { table: true },
  });
  if (paidBillRequest) realtimeHub.emit(EVENT_BILL_REQUEST, paidBillRequest);

  return {
    success: true,
    payment: paymentResult.payment,
    order: paymentResult.updatedOrder,
    changeAmount,
  };
}
