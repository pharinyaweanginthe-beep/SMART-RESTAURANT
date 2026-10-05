import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { realtimeHub, EVENT_TABLE_UPDATED } from "@/lib/realtime";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์แก้ไขโต๊ะ" }, { status: 403 });
    }
    if (session.role !== "ADMIN") {
      const ownedTable = await prisma.table.findFirst({
        where: { id: params.id, branchId: session.branchId || "__unassigned__" },
        select: { id: true },
      });
      if (!ownedTable) return NextResponse.json({ success: false, error: "ไม่พบโต๊ะในสาขาของคุณ" }, { status: 404 });
    }
    const body = await request.json();
    const updatedTable = await prisma.table.update({
      where: { id: params.id },
      data: {
        status: body.status,
        capacity: body.capacity,
        number: body.number,
      },
    });

    realtimeHub.emit(EVENT_TABLE_UPDATED, updatedTable);

    return NextResponse.json({ success: true, data: updatedTable, message: "อัปเดตสถานะโต๊ะสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
