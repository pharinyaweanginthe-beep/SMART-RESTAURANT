const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const demoMenuItems = require("./demo-menu-items");
const { applyDemoMenuImages } = require("./demo-menu-images");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with DEMO DATA...");

  // Clean existing data if any
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.memberPoint.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.restaurant.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "SMART RESTAURANT [DEMO DATA]",
      logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80",
      address: "123/45 ถนนสุขุมวิท กรุงเทพมหานคร",
      phone: "02-123-4567",
      status: "ACTIVE",
    },
  });

  // 2. Branch
  const mainBranch = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: "สาขาหลัก (สยาม) [DEMO DATA]",
      code: "BR-001",
      address: "ศูนย์การค้าสยาม ชั้น 4 กรุงเทพฯ",
      phone: "081-999-8888",
      openingHours: "00:00 - 23:59",
      status: "ACTIVE",
    },
  });

  const subBranch = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: "สาขา 2 (อารีย์) [DEMO DATA]",
      code: "BR-002",
      address: "ซอยอารีย์ พญาไท กรุงเทพฯ",
      phone: "081-777-6666",
      openingHours: "11:00 - 23:00",
      status: "ACTIVE",
    },
  });

  // 3. Users with Roles
  const adminUser = await prisma.user.create({
    data: {
      name: "ผู้ดูแลระบบ (Admin) [DEMO]",
      email: "admin@smartrestaurant.com",
      password: hashedPassword,
      role: "ADMIN",
      restaurantId: restaurant.id,
      branchId: mainBranch.id,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "ผู้จัดการร้าน (Manager) [DEMO]",
      email: "manager@smartrestaurant.com",
      password: hashedPassword,
      role: "MANAGER",
      restaurantId: restaurant.id,
      branchId: mainBranch.id,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      name: "แคชเชียร์ (Cashier) [DEMO]",
      email: "cashier@smartrestaurant.com",
      password: hashedPassword,
      role: "CASHIER",
      restaurantId: restaurant.id,
      branchId: mainBranch.id,
    },
  });

  const kitchenUser = await prisma.user.create({
    data: {
      name: "หัวหน้าครัว (Kitchen) [DEMO]",
      email: "kitchen@smartrestaurant.com",
      password: hashedPassword,
      role: "KITCHEN",
      restaurantId: restaurant.id,
      branchId: mainBranch.id,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: "พนักงานเสิร์ฟ (Staff) [DEMO]",
      email: "staff@smartrestaurant.com",
      password: hashedPassword,
      role: "STAFF",
      restaurantId: restaurant.id,
      branchId: mainBranch.id,
    },
  });

  // 4. Tables (01 to 10)
  const tablesData = [
    { number: "01", capacity: 2, status: "AVAILABLE" },
    { number: "02", capacity: 4, status: "AVAILABLE" },
    { number: "03", capacity: 4, status: "OCCUPIED" },
    { number: "04", capacity: 2, status: "WAITING_PAYMENT" },
    { number: "05", capacity: 6, status: "RESERVED" },
    { number: "06", capacity: 4, status: "AVAILABLE" },
    { number: "07", capacity: 8, status: "AVAILABLE" },
    { number: "08", capacity: 4, status: "OUT_OF_SERVICE" },
    { number: "09", capacity: 2, status: "AVAILABLE" },
    { number: "10", capacity: 4, status: "AVAILABLE" },
  ];

  const createdTables = [];
  for (const t of tablesData) {
    const table = await prisma.table.create({
      data: {
        branchId: mainBranch.id,
        number: t.number,
        capacity: t.capacity,
        status: t.status,
        qrCodeUrl: `/menu/${t.number}`,
      },
    });
    createdTables.push(table);
  }

  // 5. Categories
  const catSingle = await prisma.category.create({
    data: { branchId: mainBranch.id, name: "อาหารจานเดียว", sortOrder: 1 },
  });
  const catThai = await prisma.category.create({
    data: { branchId: mainBranch.id, name: "อาหารไทย", sortOrder: 2 },
  });
  const catAppetizer = await prisma.category.create({
    data: { branchId: mainBranch.id, name: "อาหารทานเล่น", sortOrder: 3 },
  });
  const catDrink = await prisma.category.create({
    data: { branchId: mainBranch.id, name: "เครื่องดื่ม", sortOrder: 4 },
  });
  const catDessert = await prisma.category.create({
    data: { branchId: mainBranch.id, name: "ของหวาน", sortOrder: 5 },
  });

  // 6. Menu Items
  const menuItemKaprao = await prisma.menuItem.create({
    data: {
      branchId: mainBranch.id,
      categoryId: catSingle.id,
      name: "กะเพราไก่ไข่ดาว [DEMO]",
      description: "ผัดกะเพราเนื้อไก่สับทรงเครื่อง เสิร์ฟพร้อมไข่ดาวและข้าวสวยร้อนๆ",
      price: 85.0,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
      isAvailable: true,
      isFeatured: true,
      options: {
        create: [
          { groupName: "ระดับความเผ็ด", selectionMode: "SINGLE", name: "ไม่เผ็ด", price: 0 },
          { groupName: "ระดับความเผ็ด", selectionMode: "SINGLE", name: "เผ็ดน้อย", price: 0 },
          { groupName: "ระดับความเผ็ด", selectionMode: "SINGLE", name: "เผ็ดกลาง", price: 0 },
          { groupName: "ระดับความเผ็ด", selectionMode: "SINGLE", name: "เผ็ดมาก", price: 0 },
          { groupName: "เพิ่มเติม", selectionMode: "MULTIPLE", name: "เพิ่มไข่ดาว", price: 15 },
          { groupName: "เพิ่มเติม", selectionMode: "MULTIPLE", name: "เพิ่มเนื้อไก่", price: 25 },
        ],
      },
    },
  });

  const menuItemKhaoPad = await prisma.menuItem.create({
    data: {
      branchId: mainBranch.id,
      categoryId: catSingle.id,
      name: "ข้าวผัดหมู [DEMO]",
      description: "ข้าวผัดโบราณหอมกลิ่นกระทะ หั่นหมูชิ้นนุ่ม ชวนรับประทาน",
      price: 75.0,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80",
      isAvailable: true,
    },
  });

  const menuItemTomYum = await prisma.menuItem.create({
    data: {
      branchId: mainBranch.id,
      categoryId: catThai.id,
      name: "ต้มยำกุ้งแม่น้ำน้ำข้น [DEMO]",
      description: "ต้มยำกุ้งรสเด็ด เข้มข้นถึงเครื่องต้มยำ สมุนไพรไทยแท้",
      price: 220.0,
      imageUrl: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=500&auto=format&fit=crop&q=80",
      isAvailable: true,
    },
  });

  const menuItemThaiTea = await prisma.menuItem.create({
    data: {
      branchId: mainBranch.id,
      categoryId: catDrink.id,
      name: "ชาไทยเย็นสูตรเข้มข้น [DEMO]",
      description: "ชาไทยหอมหวานกลมกล่อม ใส่นมสดแท้ 100%",
      price: 45.0,
      imageUrl: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop&q=80",
      isAvailable: true,
    },
  });

  const menuItemKhaoManGai = await prisma.menuItem.create({
    data: {
      branchId: mainBranch.id,
      categoryId: catSingle.id,
      name: "ข้าวมันไก่ตอน [DEMO]",
      description: "ข้าวมันหอมนุ่ม ไก่ตอนเนื้อแน่น เสิร์ฟพร้อมน้ำจิ้มสูตรเต้าเจี้ยวพิเศษ",
      price: 80.0,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80",
      isAvailable: true,
    },
  });

  const categoryIdsByName = new Map([
    ["อาหารจานเดียว", catSingle.id],
    ["อาหารไทย", catThai.id],
    ["อาหารทานเล่น", catAppetizer.id],
    ["เครื่องดื่ม", catDrink.id],
    ["ของหวาน", catDessert.id],
  ]);
  await prisma.menuItem.createMany({
    data: demoMenuItems.map(({ categoryName, ...item }) => ({
      ...item,
      branchId: mainBranch.id,
      categoryId: categoryIdsByName.get(categoryName),
      isAvailable: true,
      status: "ACTIVE",
    })),
  });
  await applyDemoMenuImages(prisma, mainBranch.id);

  // 7. Suppliers & Ingredients
  const supplier = await prisma.supplier.create({
    data: {
      branchId: mainBranch.id,
      name: "บริษัท ซัพพลายเออร์ วัตถุดิบสด จำกัด [DEMO]",
      contactPerson: "คุณสมชาย",
      phone: "089-111-2222",
      email: "supply@freshfood.co.th",
    },
  });

  const ingChicken = await prisma.ingredient.create({
    data: {
      branchId: mainBranch.id,
      supplierId: supplier.id,
      name: "เนื้อไก่สด",
      sku: "ING-CHICKEN-01",
      unit: "g",
      minStock: 2000,
      costPerUnit: 0.12,
    },
  });

  const ingBasil = await prisma.ingredient.create({
    data: {
      branchId: mainBranch.id,
      supplierId: supplier.id,
      name: "ใบกะเพรา",
      sku: "ING-BASIL-01",
      unit: "g",
      minStock: 500,
      costPerUnit: 0.08,
    },
  });

  const ingChili = await prisma.ingredient.create({
    data: {
      branchId: mainBranch.id,
      supplierId: supplier.id,
      name: "พริกจินดา",
      sku: "ING-CHILI-01",
      unit: "g",
      minStock: 300,
      costPerUnit: 0.15,
    },
  });

  const ingGarlic = await prisma.ingredient.create({
    data: {
      branchId: mainBranch.id,
      supplierId: supplier.id,
      name: "กระเทียมสด",
      sku: "ING-GARLIC-01",
      unit: "g",
      minStock: 300,
      costPerUnit: 0.10,
    },
  });

  const ingOil = await prisma.ingredient.create({
    data: {
      branchId: mainBranch.id,
      supplierId: supplier.id,
      name: "น้ำมันพืช",
      sku: "ING-OIL-01",
      unit: "ml",
      minStock: 1000,
      costPerUnit: 0.05,
    },
  });

  // 8. Recipe for กะเพราไก่
  const recipeKaprao = await prisma.recipe.create({
    data: {
      menuItemId: menuItemKaprao.id,
      name: "สูตรกะเพราไก่มาตรฐาน",
      description: "สูตรลับตัดสต็อกอัตโนมัติ",
      items: {
        create: [
          { ingredientId: ingChicken.id, quantityRequired: 150 },
          { ingredientId: ingBasil.id, quantityRequired: 20 },
          { ingredientId: ingChili.id, quantityRequired: 10 },
          { ingredientId: ingGarlic.id, quantityRequired: 10 },
          { ingredientId: ingOil.id, quantityRequired: 10 },
        ],
      },
    },
  });

  // 9. Inventory Stock setup
  const invChicken = await prisma.inventory.create({
    data: { branchId: mainBranch.id, ingredientId: ingChicken.id, quantity: 5000 },
  });
  const invBasil = await prisma.inventory.create({
    data: { branchId: mainBranch.id, ingredientId: ingBasil.id, quantity: 400 }, // Low stock alert! (minStock = 500)
  });
  const invChili = await prisma.inventory.create({
    data: { branchId: mainBranch.id, ingredientId: ingChili.id, quantity: 1500 },
  });
  const invGarlic = await prisma.inventory.create({
    data: { branchId: mainBranch.id, ingredientId: ingGarlic.id, quantity: 1200 },
  });
  const invOil = await prisma.inventory.create({
    data: { branchId: mainBranch.id, ingredientId: ingOil.id, quantity: 4000 },
  });

  // 10. Initial Inventory Transactions
  await prisma.inventoryTransaction.create({
    data: {
      inventoryId: invChicken.id,
      type: "IN",
      amount: 5000,
      note: "รับสินค้าเข้าคลังครั้งแรก [DEMO]",
      performedBy: adminUser.id,
    },
  });

  // 11. Customer & Members
  const customer1 = await prisma.customer.create({
    data: {
      name: "คุณวิภาวรรณ สุขเสริฐ [DEMO]",
      phone: "0891234567",
      email: "viphawan@example.com",
      points: 150,
      totalSpending: 1500.0,
    },
  });

  // 12. Discounts
  const discount10 = await prisma.discount.create({
    data: {
      branchId: mainBranch.id,
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minPurchase: 300,
      status: "ACTIVE",
    },
  });

  const discount50 = await prisma.discount.create({
    data: {
      branchId: mainBranch.id,
      code: "DISCOUNT50",
      type: "FIXED_AMOUNT",
      value: 50,
      minPurchase: 200,
      status: "ACTIVE",
    },
  });

  // 13. Create sample active order for Table 03
  const table3 = createdTables.find((t) => t.number === "03");
  if (table3) {
    const activeOrder = await prisma.order.create({
      data: {
        orderNumber: "ORD-20261003-0001",
        branchId: mainBranch.id,
        tableId: table3.id,
        status: "COOKING",
        paymentStatus: "UNPAID",
        customerName: "ลูกค้าโต๊ะ 03",
        subtotal: 215.0,
        netAmount: 215.0,
        orderItems: {
          create: [
            { menuItemId: menuItemKaprao.id, quantity: 2, price: 85.0, status: "COOKING", specialNotes: "เผ็ดน้อย" },
            { menuItemId: menuItemThaiTea.id, quantity: 1, price: 45.0, status: "READY", specialNotes: "หวานน้อย" },
          ],
        },
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
