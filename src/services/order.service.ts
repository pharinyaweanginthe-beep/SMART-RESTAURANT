import { prisma } from "@/lib/prisma";
import { checkStockForMenuItem } from "./inventory.service";
import { realtimeHub, EVENT_ORDER_CREATED, EVENT_ORDER_UPDATED, EVENT_TABLE_UPDATED } from "@/lib/realtime";
import { randomUUID } from "crypto";

export interface CreateOrderParams {
  branchId: string;
  tableId: string;
  customerName?: string;
  specialNotes?: string;
  discountCode?: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialNotes?: string;
    selectedOptionIds?: string[];
  }[];
}

export async function validateDiscount(branchId: string, subtotal: number, code: string) {
  const discount = await prisma.discount.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (
    !discount ||
    discount.status !== "ACTIVE" ||
    (discount.branchId && discount.branchId !== branchId) ||
    discount.startDate > now ||
    (discount.endDate && discount.endDate < now) ||
    (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit)
  ) {
    throw new Error("โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ");
  }
  if (subtotal < discount.minPurchase) {
    throw new Error(`ยอดสั่งซื้อขั้นต่ำสำหรับส่วนลดนี้คือ ฿${discount.minPurchase}`);
  }
  const discountAmount =
    discount.type === "PERCENTAGE"
      ? Math.min(subtotal, (subtotal * discount.value) / 100)
      : Math.min(subtotal, discount.value);
  return { id: discount.id, code: discount.code, discountAmount };
}

export async function createOrder(params: CreateOrderParams) {
  const table = await prisma.table.findUnique({
    where: { id: params.tableId },
    include: { branch: { include: { restaurant: true } } },
  });
  if (!table || table.branchId !== params.branchId) {
    throw new Error("ไม่พบโต๊ะนี้ในสาขาที่เลือก");
  }
  if (["RESERVED", "OUT_OF_SERVICE", "WAITING_PAYMENT"].includes(table.status)) {
    throw new Error("โต๊ะนี้ยังไม่พร้อมให้บริการ");
  }
  if (table.branch.status !== "ACTIVE" || table.branch.restaurant.status !== "ACTIVE") {
    throw new Error("สาขานี้ปิดให้บริการ");
  }

  // 1. Verify items & stock
  const itemDetails: {
    menuItemId: string;
    quantity: number;
    price: number;
    specialNotes: string | null;
    status: string;
    selectedOptions: string | null;
  }[] = [];
  let subtotal = 0;

  for (const item of params.items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
      include: { options: { where: { isAvailable: true } } },
    });

    if (!menuItem || menuItem.branchId !== table.branchId || menuItem.status !== "ACTIVE" || !menuItem.isAvailable) {
      throw new Error(`เมนู ${menuItem?.name || "ที่ระบุ"} ไม่พร้อมขายในขณะนี้`);
    }

    // Check recipe stock
    const stockCheck = await checkStockForMenuItem(item.menuItemId, item.quantity);
    if (!stockCheck.success) {
      const names = stockCheck.insufficientItems.map((i) => i.ingredientName).join(", ");
      throw new Error(`วัตถุดิบ ${names} ไม่เพียงพอสำหรับการทำ ${menuItem.name}`);
    }

    const selectedOptionIds = [...new Set(item.selectedOptionIds || [])];
    const selectedOptions = menuItem.options.filter((option) => selectedOptionIds.includes(option.id));
    if (selectedOptions.length !== selectedOptionIds.length) {
      throw new Error(`ตัวเลือกของเมนู ${menuItem.name} ไม่ถูกต้องหรือหมดแล้ว`);
    }
    const singleSelectionGroups = selectedOptions
      .filter((option) => option.selectionMode === "SINGLE")
      .map((option) => option.groupName);
    if (new Set(singleSelectionGroups).size !== singleSelectionGroups.length) {
      throw new Error(`เลือกตัวเลือกได้เพียงหนึ่งรายการในแต่ละกลุ่มของเมนู ${menuItem.name}`);
    }
    const unitPrice = menuItem.price + selectedOptions.reduce((sum, option) => sum + option.price, 0);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    itemDetails.push({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: unitPrice,
      specialNotes: item.specialNotes || null,
      status: "PENDING",
      selectedOptions: selectedOptions.length
        ? JSON.stringify(selectedOptions.map(({ id, groupName, name, price }) => ({ id, groupName, name, price })))
        : null,
    });
  }

  // 2. Validate discount if provided
  let discountAmount = 0;
  let discountId: string | undefined = undefined;

  if (params.discountCode) {
    const discount = await validateDiscount(table.branchId, subtotal, params.discountCode);
    discountId = discount.id;
    discountAmount = discount.discountAmount;
  }

  const netAmount = Math.max(0, subtotal - discountAmount);

  // 3. Generate unique Order Number (ORD-YYYYMMDD-xxxx)
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const orderNumber = `ORD-${todayStr}-${randomUUID().slice(0, 6).toUpperCase()}`;

  // 4. Database Transaction: Create Order & Update Table Status to OCCUPIED
  const newOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        branchId: params.branchId,
        tableId: params.tableId,
        customerName: params.customerName || "ลูกค้าโต๊ะ",
        specialNotes: params.specialNotes || null,
        subtotal,
        discountAmount,
        discountId: discountId || null,
        netAmount,
        status: "PENDING",
        paymentStatus: "UNPAID",
        orderItems: {
          create: itemDetails,
        },
      },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
        table: true,
        branch: true,
      },
    });

    await tx.table.update({
      where: { id: params.tableId },
      data: { status: "OCCUPIED" },
    });
    if (discountId) {
      await tx.discount.update({
        where: { id: discountId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return order;
  });

  // 5. Trigger Real-time notifications
  realtimeHub.emit(EVENT_ORDER_CREATED, newOrder);
  realtimeHub.emit(EVENT_TABLE_UPDATED, { tableId: params.tableId, status: "OCCUPIED" });

  return newOrder;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      orderItems: { include: { menuItem: true } },
      table: true,
    },
  });

  if (status === "WAITING_PAYMENT") {
    await prisma.table.update({
      where: { id: updatedOrder.tableId },
      data: { status: "WAITING_PAYMENT" },
    });
  }

  realtimeHub.emit(EVENT_ORDER_UPDATED, updatedOrder);
  return updatedOrder;
}

export async function updateOrderItemStatus(orderItemId: string, status: string) {
  const updatedItem = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status },
    include: {
      order: {
        include: {
          orderItems: true,
        },
      },
    },
  });

  const allItems = updatedItem.order.orderItems;
  let orderStatus: string | undefined;
  if (allItems.every((item) => item.status === "SERVED")) {
    orderStatus = "SERVED";
  } else if (allItems.every((item) => ["READY", "SERVED"].includes(item.status))) {
    orderStatus = "READY";
  } else if (allItems.some((item) => item.status === "COOKING")) {
    orderStatus = "COOKING";
  }

  if (orderStatus && orderStatus !== updatedItem.order.status) {
    await prisma.order.update({
      where: { id: updatedItem.orderId },
      data: { status: orderStatus },
    });
  }
  const refreshedOrder = await prisma.order.findUnique({
    where: { id: updatedItem.orderId },
    include: { orderItems: { include: { menuItem: true } }, table: true, branch: true },
  });
  if (refreshedOrder) realtimeHub.emit(EVENT_ORDER_UPDATED, refreshedOrder);
  return updatedItem;
}
