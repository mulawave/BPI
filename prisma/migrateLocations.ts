import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Country {
  id: number;
  name: string;
  dialCode: number | null;
  code: string | null;
  createdDatetime: Date | null;
}

interface State {
  id: number;
  countryId: number;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface City {
  id: number;
  name: string;
  stateId: number;
}

function parseValue(value: string): any {
  if (!value || value === "NULL" || value === "null") return null;
  
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  }
  
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  
  return value;
}

function parseFields(valuesString: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";
  
  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];
    const nextChar = valuesString[i + 1];
    
    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      continue;
    } else if (char === quoteChar && inQuotes) {
      if (nextChar === quoteChar) {
        current += char;
        i++;
        continue;
      }
      inQuotes = false;
      quoteChar = "";
      continue;
    }
    
    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    fields.push(current.trim());
  }
  
  return fields;
}

function parseCountriesInsert(line: string): Country[] {
  const countries: Country[] = [];
  const insertMatch = line.match(/INSERT INTO `tbl_countries`.*?VALUES\s*(.+);?$/s);
  
  if (!insertMatch) return countries;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 5) {
      const id = parseValue(fields[0]);
      const name = parseValue(fields[1]);
      const dialCode = parseValue(fields[2]);
      const code = parseValue(fields[3]);
      const createdDatetime = parseValue(fields[4]);
      
      countries.push({
        id: Number(id),
        name: String(name),
        dialCode: dialCode ? Number(dialCode) : null,
        code: code ? String(code) : null,
        createdDatetime: createdDatetime ? new Date(createdDatetime) : null,
      });
    }
  }
  
  return countries;
}

function parseStatesInsert(line: string): State[] {
  const states: State[] = [];
  const insertMatch = line.match(/INSERT INTO `tbl_states`.*?VALUES\s*(.+);?$/s);
  
  if (!insertMatch) return states;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 5) {
      const id = parseValue(fields[0]);
      const countryId = parseValue(fields[1]);
      const name = parseValue(fields[2]);
      const createdAt = parseValue(fields[3]);
      const updatedAt = parseValue(fields[4]);
      
      states.push({
        id: Number(id),
        countryId: Number(countryId),
        name: String(name),
        createdAt: createdAt ? new Date(createdAt) : null,
        updatedAt: updatedAt ? new Date(updatedAt) : null,
      });
    }
  }
  
  return states;
}

function parseCitiesInsert(line: string): City[] {
  const cities: City[] = [];
  const insertMatch = line.match(/INSERT INTO `tbl_city`.*?VALUES\s*(.+);?$/s);
  
  if (!insertMatch) return cities;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 3) {
      const id = parseValue(fields[0]);
      const name = parseValue(fields[1]);
      const stateId = parseValue(fields[2]);
      
      cities.push({
        id: Number(id),
        name: String(name),
        stateId: Number(stateId),
      });
    }
  }
  
  return cities;
}

async function migrateLocations() {
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  
  console.log("🌍 Starting location data migration...\n");
  
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");
  
  const countries: Country[] = [];
  const states: State[] = [];
  const cities: City[] = [];
  
  let currentInsert = "";
  let inCountriesInsert = false;
  let inStatesInsert = false;
  let inCitiesInsert = false;
  
  console.log("📖 Parsing SQL dump...");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Parse countries
    if (trimmedLine.startsWith("INSERT INTO `tbl_countries`")) {
      inCountriesInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        countries.push(...parseCountriesInsert(currentInsert));
        currentInsert = "";
        inCountriesInsert = false;
      }
    } else if (inCountriesInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        countries.push(...parseCountriesInsert(currentInsert));
        currentInsert = "";
        inCountriesInsert = false;
      }
    }
    
    // Parse states
    if (trimmedLine.startsWith("INSERT INTO `tbl_states`")) {
      inStatesInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        states.push(...parseStatesInsert(currentInsert));
        currentInsert = "";
        inStatesInsert = false;
      }
    } else if (inStatesInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        states.push(...parseStatesInsert(currentInsert));
        currentInsert = "";
        inStatesInsert = false;
      }
    }
    
    // Parse cities
    if (trimmedLine.startsWith("INSERT INTO `tbl_city`")) {
      inCitiesInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        cities.push(...parseCitiesInsert(currentInsert));
        currentInsert = "";
        inCitiesInsert = false;
      }
    } else if (inCitiesInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        cities.push(...parseCitiesInsert(currentInsert));
        currentInsert = "";
        inCitiesInsert = false;
      }
    }
  }
  
  console.log(`\n📊 Parsed data:`);
  console.log(`   Countries: ${countries.length}`);
  console.log(`   States: ${states.length}`);
  console.log(`   Cities: ${cities.length}\n`);
  
  // Insert countries
  console.log("🌎 Migrating countries...");
  let countrySuccess = 0;
  let countryFailed = 0;
  
  for (const country of countries) {
    try {
      await prisma.country.create({
        data: {
          id: country.id,
          name: country.name,
          dialCode: country.dialCode,
          code: country.code,
          createdDatetime: country.createdDatetime,
        },
      });
      countrySuccess++;
    } catch (error) {
      countryFailed++;
      console.log(`   ❌ Failed to insert country ${country.id}: ${country.name}`);
    }
  }
  
  console.log(`   ✅ Countries: ${countrySuccess} migrated, ${countryFailed} failed\n`);
  
  // Insert states
  console.log("🏙️  Migrating states...");
  let stateSuccess = 0;
  let stateFailed = 0;
  
  for (const state of states) {
    try {
      await prisma.state.create({
        data: {
          id: state.id,
          countryId: state.countryId,
          name: state.name,
          createdAt: state.createdAt,
          updatedAt: state.updatedAt,
        },
      });
      stateSuccess++;
    } catch (error) {
      stateFailed++;
      console.log(`   ❌ Failed to insert state ${state.id}: ${state.name}`);
    }
  }
  
  console.log(`   ✅ States: ${stateSuccess} migrated, ${stateFailed} failed\n`);
  
  // Insert cities
  console.log("🏘️  Migrating cities...");
  let citySuccess = 0;
  let cityFailed = 0;
  
  for (const city of cities) {
    try {
      await prisma.city.create({
        data: {
          id: city.id,
          name: city.name,
          stateId: city.stateId,
        },
      });
      citySuccess++;
    } catch (error) {
      cityFailed++;
      console.log(`   ❌ Failed to insert city ${city.id}: ${city.name}`);
    }
  }
  
  console.log(`   ✅ Cities: ${citySuccess} migrated, ${cityFailed} failed\n`);
  
  console.log("=" .repeat(80));
  console.log("📈 Migration Summary:");
  console.log(`   Countries: ${countrySuccess}/${countries.length}`);
  console.log(`   States: ${stateSuccess}/${states.length}`);
  console.log(`   Cities: ${citySuccess}/${cities.length}`);
  console.log("=" .repeat(80));
}

migrateLocations()
  .then(() => {
    console.log("\n✅ Location migration completed!");
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    prisma.$disconnect();
    process.exit(1);
  });
