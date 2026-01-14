import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = "admin@bpi.com";
  const password = "Admin@123";
  const name = "BPI Administrator";

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      console.log("❌ Admin user already exists:", email);
      console.log("📧 Email:", email);
      console.log("🔑 Password:", password);
      return;
    }

    // Create password hash
    const passwordHash = await hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        name,
        emailVerified: new Date(),
        passwordHash,
        role: "admin",
        activated: true,
        verified: true,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("👤 Name:", name);
    console.log("🎭 Role:", admin.role);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 Login at: http://localhost:3000/admin/login");
    console.log("\n⚠️  Save these credentials securely!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
