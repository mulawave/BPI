import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Map of old country IDs to country codes from the SQL dump
const countryIdToCode: Record<number, string> = {
  160: 'NG', // Nigeria was 160 in old system, 157 in new
  231: 'US', // USA was 231 in old system, 229 in new
  101: 'IN', // India
  154: 'NZ', // New Zealand  
  227: 'AE', // UAE
  // Add more as needed
};

async function fixStateCountryMapping() {
  console.log('🔧 Fixing state-country mappings...\n');

  try {
    // Get all countries
    const countries = await prisma.country.findMany();
    const codeToId = Object.fromEntries(countries.map(c => [c.code, c.id]));
    
    console.log('📊 Sample country mappings:');
    console.log(`Nigeria (NG): ID ${codeToId['NG']}`);
    console.log(`USA (US): ID ${codeToId['US']}`);
    console.log(`India (IN): ID ${codeToId['IN']}`);
    console.log(`New Zealand (NZ): ID ${codeToId['NZ']}`);
    console.log(`UAE (AE): ID ${codeToId['AE']}\n`);

    // Read the SQL dump to build complete mapping
    console.log('📖 Reading SQL dump to build country ID mapping...');
    const sqlContent = fs.readFileSync('z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql', 'utf-8');
    
    // Extract country records
    const countryPattern = /\((\d+),\s*'([^']+)',\s*(\d+),\s*'([A-Z]{2})',/g;
    const oldIdToCode: Record<number, string> = {};
    
    let match;
    while ((match = countryPattern.exec(sqlContent)) !== null) {
      const oldId = parseInt(match[1]);
      const code = match[4];
      oldIdToCode[oldId] = code;
    }
    
    console.log(`Found ${Object.keys(oldIdToCode).length} country mappings\n`);

    // Get all states
    const states = await prisma.state.findMany();
    console.log(`Found ${states.length} states to fix\n`);

    let fixed = 0;
    let errors = 0;

    for (const state of states) {
      const oldCountryId = state.countryId;
      const countryCode = oldIdToCode[oldCountryId];
      
      if (!countryCode) {
        console.log(`⚠️  State "${state.name}" (ID: ${state.id}) has unknown old country ID: ${oldCountryId}`);
        errors++;
        continue;
      }
      
      const newCountryId = codeToId[countryCode];
      
      if (!newCountryId) {
        console.log(`⚠️  State "${state.name}" (ID: ${state.id}) - country code "${countryCode}" not found in new DB`);
        errors++;
        continue;
      }
      
      // Always update to the correct country ID based on the code mapping
      await prisma.state.update({
        where: { id: state.id },
        data: { countryId: newCountryId }
      });
      
      fixed++;
      
      if (fixed % 500 === 0) {
        console.log(`✅ Fixed ${fixed} states...`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Fixed: ${fixed} states`);
    console.log(`   Errors: ${errors} states`);
    console.log(`   Unchanged: ${states.length - fixed - errors} states`);

    // Verify fixes
    console.log('\n🔍 Verifying fixes...');
    const nigeria = await prisma.country.findFirst({ where: { code: 'NG' } });
    if (nigeria) {
      const nigeriaStates = await prisma.state.findMany({
        where: { countryId: nigeria.id },
        take: 5
      });
      console.log(`Nigeria states: ${nigeriaStates.map(s => s.name).join(', ')}`);
    }

    const usa = await prisma.country.findFirst({ where: { code: 'US' } });
    if (usa) {
      const usaStates = await prisma.state.findMany({
        where: { countryId: usa.id },
        take: 5
      });
      console.log(`USA states: ${usaStates.map(s => s.name).join(', ')}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStateCountryMapping();
