import * as fs from "fs";

const missingLegacyIds = [317, 222, 908, 1914, 1592, 2093, 1218, 2405, 2572, 3039, 3099, 3189, 3223, 3408, 4005];

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

function searchUsersInSQL() {
  const sqlDumpPath = "z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql";
  
  console.log("🔍 Searching for missing users in SQL dump...\n");
  
  const sqlContent = fs.readFileSync(sqlDumpPath, "utf-8");
  const lines = sqlContent.split("\n");
  
  const foundUsers = new Map<number, { email: string; firstname: string; lastname: string }>();
  let currentInsert = "";
  let inInsert = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith("INSERT INTO `users`")) {
      inInsert = true;
      currentInsert = trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        parseUsersInsert(currentInsert, foundUsers);
        currentInsert = "";
        inInsert = false;
      }
    } else if (inInsert) {
      currentInsert += " " + trimmedLine;
      
      if (trimmedLine.endsWith(";")) {
        parseUsersInsert(currentInsert, foundUsers);
        currentInsert = "";
        inInsert = false;
      }
    }
  }
  
  console.log("📊 Results:");
  console.log("=".repeat(80));
  
  missingLegacyIds.forEach(id => {
    const user = foundUsers.get(id);
    if (user) {
      console.log(`✅ Legacy ID ${id}: ${user.firstname} ${user.lastname} (${user.email})`);
    } else {
      console.log(`❌ Legacy ID ${id}: NOT FOUND in SQL dump`);
    }
  });
  
  console.log("=".repeat(80));
  console.log(`\n📈 Summary: ${foundUsers.size}/${missingLegacyIds.length} users found in SQL dump`);
}

function parseUsersInsert(line: string, foundUsers: Map<number, { email: string; firstname: string; lastname: string }>) {
  const insertMatch = line.match(/INSERT INTO `users`.*?VALUES\s*(.+);?$/s);
  if (!insertMatch) return;

  const valuesString = insertMatch[1];
  const valuePattern = /\(([^)]+)\)/g;
  let match;

  while ((match = valuePattern.exec(valuesString)) !== null) {
    const values = match[1];
    const fields = parseFields(values);
    
    if (fields.length >= 18) {
      const id = parseValue(fields[0]);
      
      // Check if this is one of our missing IDs
      if (id && missingLegacyIds.includes(Number(id))) {
        const firstname = parseValue(fields[1]) || "";
        const lastname = parseValue(fields[2]) || "";
        const email = parseValue(fields[14]) || "No email";
        
        foundUsers.set(Number(id), { email, firstname, lastname });
      }
    }
  }
}

// Run search
searchUsersInSQL();
