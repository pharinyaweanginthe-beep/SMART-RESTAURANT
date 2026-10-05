const { PrismaClient } = require("@prisma/client");
const demoMenuItems = require("./demo-menu-items");
const { applyDemoMenuImages } = require("./demo-menu-images");

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { code: "BR-001" },
    select: { id: true, name: true },
  });

  if (!branch) {
    throw new Error("ไม่พบสาขา BR-001 กรุณาตรวจสอบฐานข้อมูลก่อนเติมเมนูเดโม");
  }

  const categories = await prisma.category.findMany({
    where: { branchId: branch.id },
    select: { id: true, name: true },
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const itemsByCategory = new Map();
  for (const item of demoMenuItems) {
    const group = itemsByCategory.get(item.categoryName) || [];
    group.push(item);
    itemsByCategory.set(item.categoryName, group);
  }

  let createdCount = 0;
  for (const [categoryName, menuItems] of itemsByCategory) {
    const category = categoryByName.get(categoryName);
    if (!category) {
      throw new Error(`ไม่พบหมวดหมู่ "${categoryName}" ในสาขา ${branch.name}`);
    }

    const existing = await prisma.menuItem.findMany({
      where: { branchId: branch.id, categoryId: category.id },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((item) => item.name));
    const targetCount = Math.max(0, 10 - existing.length);
    const toCreate = [];
    for (const item of menuItems) {
      if (toCreate.length >= targetCount) break;
      if (existingNames.has(item.name)) continue;
      toCreate.push(item);
      existingNames.add(item.name);
    }

    if (toCreate.length < targetCount) {
      throw new Error(`มีรายการเมนูไม่พอสำหรับเติมหมวด "${categoryName}" ให้ครบ 10 รายการ`);
    }

    if (toCreate.length) {
      await prisma.menuItem.createMany({
        data: toCreate.map(({ categoryName: _categoryName, ...item }) => ({
          ...item,
          branchId: branch.id,
          categoryId: category.id,
          isAvailable: true,
          status: "ACTIVE",
        })),
      });
      createdCount += toCreate.length;
    }
  }

  await applyDemoMenuImages(prisma, branch.id);

  const counts = await prisma.category.findMany({
    where: { branchId: branch.id },
    orderBy: { sortOrder: "asc" },
    select: { name: true, _count: { select: { menuItems: true } } },
  });
  console.log(`เพิ่มเมนูใหม่ ${createdCount} รายการ ในสาขา ${branch.name}`);
  for (const category of counts) {
    console.log(`${category.name}: ${category._count.menuItems} เมนู`);
  }
}

main()
  .catch((error) => {
    console.error("เติมเมนูเดโมไม่สำเร็จ:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
