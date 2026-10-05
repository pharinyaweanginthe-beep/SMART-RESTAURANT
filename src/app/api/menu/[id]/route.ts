import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = await prisma.menuItem.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        categoryId: body.categoryId,
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable,
      },
    });
    return NextResponse.json({ success: true, data: updated, message: "แก้ไขเมนูสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.menuItem.update({
      where: { id: params.id },
      data: { status: "INACTIVE", isAvailable: false },
    });
    return NextResponse.json({ success: true, message: "ลบเมนูเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
