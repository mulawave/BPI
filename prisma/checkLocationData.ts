import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLocationData() {
  try {
    // Check Nigeria
    const nigeria = await prisma.country.findFirst({
      where: { name: 'Nigeria' }
    });
    console.log('\n=== NIGERIA ===');
    console.log('Nigeria Country:', nigeria);
    
    if (nigeria) {
      const nigeriaStates = await prisma.state.findMany({
        where: { countryId: nigeria.id },
        take: 10
      });
      console.log(`\nNigeria States (showing ${nigeriaStates.length}):`, nigeriaStates.map(s => s.name));
    }
    
    // Check USA
    const usa = await prisma.country.findFirst({
      where: { name: { contains: 'United States' } }
    });
    console.log('\n=== USA ===');
    console.log('USA Country:', usa);
    
    if (usa) {
      const usaStates = await prisma.state.findMany({
        where: { countryId: usa.id },
        take: 10
      });
      console.log(`\nUSA States (showing ${usaStates.length}):`, usaStates.map(s => s.name));
    }
    
    // Check if there's ID mismatch
    console.log('\n=== CHECKING FOR MISMATCHES ===');
    const allCountries = await prisma.country.findMany({
      take: 10,
      orderBy: { id: 'asc' }
    });
    console.log('First 10 Countries with IDs:', allCountries.map(c => `${c.id}: ${c.name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocationData();
