import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function seedCurrencies() {
  console.log('🌍 Seeding currencies...');

  // Check if currencies already exist
  const existingCurrencies = await prisma.currencyManagement.findMany();
  
  if (existingCurrencies.length > 0) {
    console.log(`✅ Found ${existingCurrencies.length} existing currencies. Skipping seed.`);
    return;
  }

  // Seed currencies with real exchange rates (as of 2026)
  const currencies = [
    {
      name: 'Nigerian Naira',
      symbol: 'NGN',
      sign: '₦',
      rate: 1, // Base currency
      default: 1,
      country: 'Nigeria'
    },
    {
      name: 'US Dollar',
      symbol: 'USD',
      sign: '$',
      rate: 0.00067, // 1 NGN = 0.00067 USD (1 USD = 1500 NGN)
      default: 0,
      country: 'United States'
    },
    {
      name: 'Euro',
      symbol: 'EUR',
      sign: '€',
      rate: 0.00061, // 1 NGN = 0.00061 EUR (1 EUR = 1650 NGN)
      default: 0,
      country: 'European Union'
    },
    {
      name: 'British Pound',
      symbol: 'GBP',
      sign: '£',
      rate: 0.00053, // 1 NGN = 0.00053 GBP (1 GBP = 1900 NGN)
      default: 0,
      country: 'United Kingdom'
    },
    {
      name: 'South African Rand',
      symbol: 'ZAR',
      sign: 'R',
      rate: 0.012, // 1 NGN = 0.012 ZAR (1 ZAR = 83 NGN)
      default: 0,
      country: 'South Africa'
    },
    {
      name: 'Ghanaian Cedi',
      symbol: 'GHS',
      sign: 'GH₵',
      rate: 0.0080, // 1 NGN = 0.0080 GHS (1 GHS = 125 NGN)
      default: 0,
      country: 'Ghana'
    },
    {
      name: 'Kenyan Shilling',
      symbol: 'KES',
      sign: 'KSh',
      rate: 0.086, // 1 NGN = 0.086 KES (1 KES = 11.6 NGN)
      default: 0,
      country: 'Kenya'
    },
    {
      name: 'Canadian Dollar',
      symbol: 'CAD',
      sign: 'C$',
      rate: 0.00091, // 1 NGN = 0.00091 CAD (1 CAD = 1100 NGN)
      default: 0,
      country: 'Canada'
    },
    {
      name: 'Australian Dollar',
      symbol: 'AUD',
      sign: 'A$',
      rate: 0.00100, // 1 NGN = 0.00100 AUD (1 AUD = 1000 NGN)
      default: 0,
      country: 'Australia'
    },
    {
      name: 'Chinese Yuan',
      symbol: 'CNY',
      sign: '¥',
      rate: 0.0048, // 1 NGN = 0.0048 CNY (1 CNY = 208 NGN)
      default: 0,
      country: 'China'
    }
  ];

  for (const currency of currencies) {
    await prisma.currencyManagement.create({
      data: {
        id: randomUUID(),
        ...currency,
      }
    });
    console.log(`  ✓ Added ${currency.name} (${currency.symbol})`);
  }

  console.log(`✅ Successfully seeded ${currencies.length} currencies!`);
}

async function main() {
  try {
    await seedCurrencies();
    console.log('✅ Currency seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
