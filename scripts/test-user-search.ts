import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testUserSearch() {
  try {
    console.log("\n=== TESTING USER SEARCH FUNCTIONALITY ===\n");

    // Test 1: Count total users
    const totalUsers = await prisma.user.count();
    console.log(`✓ Total users in database: ${totalUsers}`);

    // Test 2: Get first 5 users
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });
    console.log(`\n✓ Sample users:`);
    sampleUsers.forEach((u) => {
      console.log(`  - ${u.name || "No name"} | ${u.email} | ${u.username || "No username"}`);
    });

    // Test 3: Search by partial email (like the frontend does)
    const testEmail = sampleUsers[0]?.email || "test";
    const searchTerm = testEmail.substring(0, 5); // First 5 chars
    console.log(`\n✓ Testing search with query: "${searchTerm}"`);

    const searchResults = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: "insensitive" } },
          { name: { contains: searchTerm, mode: "insensitive" } },
          { username: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
      take: 20,
    });

    console.log(`  Found ${searchResults.length} results:`);
    searchResults.forEach((u) => {
      console.log(`  - ${u.name || "No name"} | ${u.email} | ${u.username || "No username"}`);
    });

    // Test 4: Search for "richard" (from screenshot)
    console.log(`\n✓ Testing search for "richard" (from screenshot):`);
    const richardSearch = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: "richard", mode: "insensitive" } },
          { name: { contains: "richard", mode: "insensitive" } },
          { username: { contains: "richard", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
      take: 20,
    });

    console.log(`  Found ${richardSearch.length} results:`);
    richardSearch.forEach((u) => {
      console.log(`  - ${u.name || "No name"} | ${u.email} | ${u.username || "No username"}`);
    });

    // Test 5: Search for admin
    console.log(`\n✓ Searching for admin users:`);
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "admin",
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
      take: 5,
    });

    console.log(`  Found ${adminUsers.length} admin(s):`);
    adminUsers.forEach((u) => {
      console.log(`  - ${u.name || "No name"} | ${u.email} | ${u.role}`);
    });

    console.log("\n✅ User search test complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserSearch();
