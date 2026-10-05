const imagePoolByCategory = {
  "อาหารจานเดียว": [
    "1589301760014-d929f3979dbc",
    "1603133872878-684f208fb84b",
    "1512058564366-18510be2db19",
    "1506084868230-bb9d95c24759",
    "1504674900247-0877df9cc836",
    "1498837167922-ddd27525d352",
    "1559847844-5315695dadae",
    "1540189549336-e6e99c3679fe",
    "1546069901-ba9599a7e63c",
    "1490645935967-10de6ba17061",
  ],
  "อาหารไทย": [
    "1548943487-a2e4e43b4853",
    "1547592180-85f173990554",
    "1555939594-58d7cb561ad1",
    "1476224203421-9ac39bcb3327",
    "1529042410759-befb1204b468",
    "1555126634-323283e090fa",
    "1552611052-33e04de081de",
    "1601050690597-df0568f70950",
    "1559181567-c3190ca9959b",
    "1617093727343-374698b1b08d",
  ],
  "อาหารทานเล่น": [
    "1568901346375-23c9450c58cd",
    "1565299624946-b28f40a0ae38",
    "1565299507177-b0ac66763828",
    "1512621776951-a57141f2eefd",
    "1567620905732-2d1ec7ab7445",
    "1562967914-608f82629710",
    "1626082927389-6cd097cdc6ec",
    "1608039829572-78524f79c4c7",
    "1573080496219-bb080dd4f877",
    "1630384060421-cb20d0e0649d",
  ],
  "เครื่องดื่ม": [
    "1558857563-b371033873b8",
    "1517701604599-bb29b565090c",
    "1461023058943-07fcbe16d735",
    "1544145945-f90425340c7e",
    "1509042239860-f550ce710b93",
    "1495474472287-4d71bcdd2085",
    "1517701550927-30cf4ba1dba5",
    "1541167760496-1628856ab772",
    "1511920170033-f8396924c348",
    "1572490122747-3968b75cc699",
  ],
  "ของหวาน": [
    "1565958011703-44f9829ba187",
    "1488477181946-6428a0291777",
    "1578985545062-69928b1d9587",
    "1551024506-0bccd828d307",
    "1606313564200-e75d5e30476c",
    "1563805042-7684c019e1cb",
    "1501446529957-6226bd447c46",
    "1497034825429-c343d7c6a68f",
    "1563729784474-d77dbb933a9e",
    "1603532648955-039310d9ed75",
  ],
};

async function applyDemoMenuImages(prisma, branchId) {
  for (const [categoryName, imageIds] of Object.entries(imagePoolByCategory)) {
    const category = await prisma.category.findFirst({
      where: { branchId, name: categoryName },
      select: { id: true },
    });
    if (!category) {
      throw new Error(`ไม่พบหมวดหมู่ "${categoryName}" สำหรับเพิ่มรูปเมนู`);
    }

    const items = await prisma.menuItem.findMany({
      where: {
        branchId,
        categoryId: category.id,
        name: { endsWith: "[DEMO]" },
      },
      orderBy: { name: "asc" },
      select: { id: true },
    });

    if (items.length) {
      await prisma.$transaction(
        items.map((item, index) =>
          prisma.menuItem.update({
            where: { id: item.id },
            data: { imageUrl: `/menu-items/${imageIds[index % imageIds.length]}.jpg` },
          })
        )
      );
    }
  }
}

module.exports = { applyDemoMenuImages, imagePoolByCategory };
