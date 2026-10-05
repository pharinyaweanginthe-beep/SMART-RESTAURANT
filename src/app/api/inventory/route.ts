import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventoryTransactionSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const where = branchId ? { branchId } : {};

    const items = await prisma.inventory.findMany({
      where,
      include: {
        ingredient: { include: { supplier: true } },
        transactions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { user: true },
        },
      },
      orderBy: { ingredient: { name: "asc" } },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const validated = inventoryTransactionSchema.parse(body);

    const inventory = await prisma.inventory.findUnique({
      where: { id: validated.inventoryId },
    });

    if (!inventory) throw new Error("ไม่พบรายการวัตถุดิบในสต็อก");

    let newQty = inventory.quantity;
    if (validated.type === "IN") {
      newQty += validated.amount;
    } else if (validated.type === "OUT") {
      if (inventory.quantity < validated.amount) {
        throw new Error("สต็อกคงเหลือไม่พอตัดเบิก");
      }
      newQty -= validated.amount;
    } else if (validated.type === "ADJUSTMENT") {
      newQty = validated.amount;
    }

    const updated = await prisma.$transaction([
      prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQty, lastUpdated: new Date() },
      }),
      prisma.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: validated.type,
          amount: validated.amount,
          note: validated.note || `ปรับปรุงสต็อกประเภท ${validated.type}`,
          performedBy: session?.id || null,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: updated[0], message: "บันทึกสต็อกสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
