import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Known state-to-country mappings for major countries
const stateCountryMappings = {
  // Nigeria states
  'Lagos': 'NG',
  'Abuja': 'NG',
  'Kano': 'NG',
  'Abia': 'NG',
  'Adamawa': 'NG',
  'Akwa Ibom': 'NG',
  'Anambra': 'NG',
  'Bauchi': 'NG',
  'Bayelsa': 'NG',
  'Benue': 'NG',
  'Borno': 'NG',
  'Cross River': 'NG',
  'Delta': 'NG',
  'Ebonyi': 'NG',
  'Edo': 'NG',
  'Ekiti': 'NG',
  'Enugu': 'NG',
  'Gombe': 'NG',
  'Imo': 'NG',
  'Jigawa': 'NG',
  'Kaduna': 'NG',
  'Kebbi': 'NG',
  'Kogi': 'NG',
  'Kwara': 'NG',
  'Nassarawa': 'NG',
  'Niger': 'NG',
  'Ogun': 'NG',
  'Ondo': 'NG',
  'Osun': 'NG',
  'Oyo': 'NG',
  'Plateau': 'NG',
  'Rivers': 'NG',
  'Sokoto': 'NG',
  'Taraba': 'NG',
  'Yobe': 'NG',
  'Zamfara': 'NG',
  
  // New Zealand states
  'Auckland': 'NZ',
  'Bay of Plenty': 'NZ',
  'Canterbury': 'NZ',
  'Christchurch': 'NZ',
  'Gisborne': 'NZ',
  'Hawkes Bay': 'NZ',
  'Manawatu-Wanganui': 'NZ',
  'Marlborough': 'NZ',
  'Nelson': 'NZ',
  'Northland': 'NZ',
  'Otago': 'NZ',
  'Southland': 'NZ',
  'Taranaki': 'NZ',
  'Tasman': 'NZ',
  'Waikato': 'NZ',
  'Wellington': 'NZ',
  'West Coast': 'NZ',
  
  // UAE states
  'Abu Zabi': 'AE',
  'Ajman': 'AE',
  'Dubai': 'AE',
  'Ras al-Khaymah': 'AE',
  'Sharjah': 'AE',
  'Sharjha': 'AE',
  'Umm al Qaywayn': 'AE',
  'al-Fujayrah': 'AE',
  'ash-Shariqah': 'AE',
  
  // USA states
  'Alabama': 'US',
  'Alaska': 'US',
  'Arizona': 'US',
  'Arkansas': 'US',
  'California': 'US',
  'Colorado': 'US',
  'Connecticut': 'US',
  'Delaware': 'US',
  'Florida': 'US',
  'Georgia': 'US',
  'Hawaii': 'US',
  'Idaho': 'US',
  'Illinois': 'US',
  'Indiana': 'US',
  'Iowa': 'US',
  'Kansas': 'US',
  'Kentucky': 'US',
  'Louisiana': 'US',
  'Maine': 'US',
  'Maryland': 'US',
  'Massachusetts': 'US',
  'Michigan': 'US',
  'Minnesota': 'US',
  'Mississippi': 'US',
  'Missouri': 'US',
  'Montana': 'US',
  'Nebraska': 'US',
  'Nevada': 'US',
  'New Hampshire': 'US',
  'New Jersey': 'US',
  'New Mexico': 'US',
  'New York': 'US',
  'North Carolina': 'US',
  'North Dakota': 'US',
  'Ohio': 'US',
  'Oklahoma': 'US',
  'Oregon': 'US',
  'Pennsylvania': 'US',
  'Rhode Island': 'US',
  'South Carolina': 'US',
  'South Dakota': 'US',
  'Tennessee': 'US',
  'Texas': 'US',
  'Utah': 'US',
  'Vermont': 'US',
  'Virginia': 'US',
  'Washington': 'US',
  'West Virginia': 'US',
  'Wisconsin': 'US',
  'Wyoming': 'US',
};

async function fixStateCountriesByName() {
  console.log('🔧 Fixing state-country mappings by state names...\n');

  try {
    // Get all countries
    const countries = await prisma.country.findMany();
    const codeToId = Object.fromEntries(countries.map(c => [c.code, c.id]));
    
    let fixed = 0;
    let notFound = 0;

    for (const [stateName, countryCode] of Object.entries(stateCountryMappings)) {
      const correctCountryId = codeToId[countryCode];
      
      if (!correctCountryId) {
        console.log(`⚠️  Country code "${countryCode}" not found`);
        continue;
      }

      // Find states by name and update their country ID
      const result = await prisma.state.updateMany({
        where: { name: stateName },
        data: { countryId: correctCountryId }
      });

      if (result.count > 0) {
        fixed += result.count;
        console.log(`✅ Fixed "${stateName}" → ${countryCode} (${result.count} states)`);
      } else {
        notFound++;
      }
    }

    console.log(`\n✅ Mapping complete!`);
    console.log(`   Fixed: ${fixed} states`);
    console.log(`   Not found: ${notFound} state names`);

    // Verify fixes
    console.log('\n🔍 Verifying fixes...');
    const nigeria = await prisma.country.findFirst({ where: { code: 'NG' } });
    if (nigeria) {
      const nigeriaStates = await prisma.state.findMany({
        where: { countryId: nigeria.id },
        take: 10
      });
      console.log(`\nNigeria (${nigeria.id}) has ${nigeriaStates.length} states:`);
      console.log(nigeriaStates.map(s => s.name).join(', '));
    }

    const usa = await prisma.country.findFirst({ where: { code: 'US' } });
    if (usa) {
      const usaStates = await prisma.state.findMany({
        where: { countryId: usa.id },
        take: 10
      });
      console.log(`\nUSA (${usa.id}) has ${usaStates.length} states:`);
      console.log(usaStates.map(s => s.name).join(', '));
    }

    const nz = await prisma.country.findFirst({ where: { code: 'NZ' } });
    if (nz) {
      const nzStates = await prisma.state.findMany({
        where: { countryId: nz.id },
        take: 10
      });
      console.log(`\nNew Zealand (${nz.id}) has ${nzStates.length} states:`);
      console.log(nzStates.map(s => s.name).join(', '));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStateCountriesByName();
