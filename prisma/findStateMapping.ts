import * as fs from "fs";

const sqlContent = fs.readFileSync("z:\\bpi\\v3\\bpi_main\\sql_dump\\beepagro_beepagro.sql", "utf-8");

// Find Nigeria country ID
const nigeriaMatch = sqlContent.match(/INSERT INTO `tbl_countries`[\s\S]*?\((\d+),\s*'Nigeria',/);
console.log("Nigeria in SQL:", nigeriaMatch ? nigeriaMatch[0] : "Not found");

// Find a Nigerian state
const lagosMatch = sqlContent.match(/\((\d+),\s*(\d+),\s*'Lagos'[^)]*\)/);
console.log("\nLagos state record:", lagosMatch ? lagosMatch[0] : "Not found");

// Find USA country ID
const usaMatch = sqlContent.match(/INSERT INTO `tbl_countries`[\s\S]*?\((\d+),\s*'United States',/);
console.log("\nUSA in SQL:", usaMatch ? usaMatch[0] : "Not found");

// Find a US state
const californiaMatch = sqlContent.match(/\((\d+),\s*(\d+),\s*'California'[^)]*\)/);
console.log("\nCalifornia state record:", californiaMatch ? californiaMatch[0] : "Not found");

// Sample a few states to see the pattern
const statesPattern = /INSERT INTO `tbl_states`[\s\S]*?VALUES\s+([\s\S]+?);/;
const statesMatch = sqlContent.match(statesPattern);
if (statesMatch) {
  const firstFewStates = statesMatch[1].split(/\),\s*\(/).slice(0, 5);
  console.log("\nFirst 5 states:");
  firstFewStates.forEach((state, i) => {
    console.log(`${i + 1}. (${state.substring(0, 100)}...`);
  });
}
