import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: { restaurant: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: branches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const branch = await prisma.branch.create({
      data: {
        restaurantId: body.restaurantId,
        name: body.name,
        code: body.code,
        address: body.address,
        phone: body.phone,
        openingHours: body.openingHours || "10:00 - 22:00",
      },
    });
    return NextResponse.json({ success: true, data: branch, message: "สร้างสาขาสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
