const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (existingAdmin) {
    console.log("An administrator account already exists; bootstrap skipped.");
    return;
  }

  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Restaurant Administrator";

  if (!email || !email.includes("@")) {
    throw new Error("INITIAL_ADMIN_EMAIL must be set to a valid email address.");
  }
  if (!password || password.length < 32) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be set to at least 32 characters.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error(
      `Cannot bootstrap administrator: ${email} is already assigned to an existing account.`
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (transaction) => {
    let restaurant = await transaction.restaurant.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!restaurant) {
      restaurant = await transaction.restaurant.create({
        data: { name: "My Restaurant" },
      });
    }

    let branch = await transaction.branch.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "asc" },
    });
    if (!branch) {
      branch = await transaction.branch.create({
        data: {
          restaurantId: restaurant.id,
          name: "Main Branch",
          code: `INIT-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });
    }

    await transaction.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        restaurantId: restaurant.id,
        branchId: branch.id,
      },
    });
  });

  console.log(`Created the initial administrator account for ${email}.`);
}

main()
  .catch((error) => {
    console.error("Administrator bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
