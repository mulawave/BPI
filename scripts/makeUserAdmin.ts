import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    // Get the user from terminal output: richardobroh@gmail.com
    const email = "richardobroh@gmail.com";
    
    const user = await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log("✅ User updated to admin!");
    console.log("📧 Email:", user.email);
    console.log("🎭 Role:", user.role);
    console.log("\n🔐 Please refresh your browser at: http://localhost:3000/admin");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
