import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCountry160() {
  const country = await prisma.country.findUnique({
    where: { id: 160 },
  });
  
  console.log("Country ID 160:", country);
  
  // Also search for Nigeria
  const nigeria = await prisma.country.findFirst({
    where: {
      name: {
        contains: "Nigeria",
        mode: "insensitive",
      },
    },
  });
  
  console.log("\nNigeria:", nigeria);
  
  prisma.$disconnect();
}

checkCountry160();
