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

  // Create default office user (uffici)
  const officePassword = await bcrypt.hash("office123", 10);
  
  const office = await prisma.user.upsert({
    where: { username: "office" },
    update: {},
    create: {
      username: "office",
      password: officePassword,
      role: UserRole.OFFICE,
    },
  });

  // Create default guest user
  const guestPassword = await bcrypt.hash("guest123", 10);
  
  const guest = await prisma.user.upsert({
    where: { username: "guest" },
    update: {},
    create: {
      username: "guest",
      password: guestPassword,
      role: UserRole.GUEST,
    },
  });

  console.log("Users created:", { admin, tech, standard, office, guest });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
