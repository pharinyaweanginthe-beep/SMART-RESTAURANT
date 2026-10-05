import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const branchId = searchParams.get("branchId");

    if (code) {
      const discount = await prisma.discount.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!discount || discount.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, error: "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: discount });
    }

    const discounts = await prisma.discount.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: discounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const discount = await prisma.discount.create({
      data: {
        code: body.code.toUpperCase(),
        type: body.type, // PERCENTAGE or FIXED_AMOUNT
        value: body.value,
        minPurchase: body.minPurchase || 0,
        branchId: body.branchId || null,
        status: "ACTIVE",
      },
    });
    return NextResponse.json({ success: true, data: discount, message: "สร้างส่วนลดสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
