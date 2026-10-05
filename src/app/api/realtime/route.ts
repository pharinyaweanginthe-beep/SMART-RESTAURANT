import { NextResponse } from "next/server";
import {
  realtimeHub,
  EVENT_ORDER_CREATED,
  EVENT_ORDER_UPDATED,
  EVENT_TABLE_UPDATED,
  EVENT_INVENTORY_LOW,
  EVENT_STAFF_REQUEST,
  EVENT_BILL_REQUEST,
} from "@/lib/realtime";
import { getSession } from "@/lib/auth";
import { resolveCustomerTable } from "@/services/customer.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (session && !["ADMIN", "MANAGER", "CASHIER", "STAFF", "KITCHEN"].includes(session.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const customerTable =
    !session && searchParams.get("table")
      ? await resolveCustomerTable(searchParams.get("table") || "", searchParams.get("qr"))
      : null;
  if (!session && !customerTable) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // ignore closed streams
        }
      };

      const allowed = (data: any) => {
        if (customerTable) return data.tableId === customerTable.id || data.table?.id === customerTable.id;
        return session?.role === "ADMIN" || data.branchId === session?.branchId;
      };
      const handleOrderCreated = (data: any) =>
        allowed(data) && sendEvent("order_created", customerTable
          ? { id: data.id, orderNumber: data.orderNumber, tableId: data.tableId }
          : data);
      const handleOrderUpdated = (data: any) =>
        allowed(data) && sendEvent("order_updated", customerTable
          ? { id: data.id, status: data.status, tableId: data.tableId }
          : data);
      const handleTableUpdated = (data: any) =>
        allowed(data) && sendEvent("table_updated", customerTable
          ? { tableId: data.tableId || data.id, status: data.status }
          : data);
      const handleInventoryLow = (data: any) =>
        !customerTable && sendEvent("inventory_low", data);
      const handleStaffRequest = (data: any) =>
        !customerTable && allowed(data) && sendEvent("staff_request", data);
      const handleBillRequest = (data: any) =>
        !customerTable && allowed(data) && sendEvent("bill_request", data);

      realtimeHub.on(EVENT_ORDER_CREATED, handleOrderCreated);
      realtimeHub.on(EVENT_ORDER_UPDATED, handleOrderUpdated);
      realtimeHub.on(EVENT_TABLE_UPDATED, handleTableUpdated);
      realtimeHub.on(EVENT_INVENTORY_LOW, handleInventoryLow);
      realtimeHub.on(EVENT_STAFF_REQUEST, handleStaffRequest);
      realtimeHub.on(EVENT_BILL_REQUEST, handleBillRequest);

      // Heartbeat every 15s to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      cleanup = () => {
        clearInterval(interval);
        realtimeHub.off(EVENT_ORDER_CREATED, handleOrderCreated);
        realtimeHub.off(EVENT_ORDER_UPDATED, handleOrderUpdated);
        realtimeHub.off(EVENT_TABLE_UPDATED, handleTableUpdated);
        realtimeHub.off(EVENT_INVENTORY_LOW, handleInventoryLow);
        realtimeHub.off(EVENT_STAFF_REQUEST, handleStaffRequest);
        realtimeHub.off(EVENT_BILL_REQUEST, handleBillRequest);
      };
    },
    cancel() {
      cleanup();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
