import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  // Create default tech user
  const techPassword = await bcrypt.hash("tech123", 10);
  
  const tech = await prisma.user.upsert({
    where: { username: "tech" },
    update: {},
    create: {
      username: "tech",
      password: techPassword,
      role: UserRole.TECH,
    },
  });

  // Create default standard user
  const standardPassword = await bcrypt.hash("user123", 10);
  
  const standard = await prisma.user.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      password: standardPassword,
      role: UserRole.STANDARD,
    },
  });

  console.log("Users created:", { admin, tech, standard });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
