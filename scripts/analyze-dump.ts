import fs from "fs";
import path from "path";

const dumpPath = path.resolve("sql_dump/beepagro_beepagro.sql");
const sqlDump = fs.readFileSync(dumpPath, "utf8");

function extractTableInserts(table: string): string[] {
  const regex = new RegExp(`INSERT INTO\\s+\`${table}\`[\\s\\S]*?;`, "gi");
  return sqlDump.match(regex) || [];
}

function parseValues(insert: string): any[] {
  const valuesPart = insert.substring(insert.indexOf("VALUES") + 6);
  const rows: string[] = [];
  let buffer = "";
  let depth = 0;

  for (const char of valuesPart) {
    if (depth === 0 && (char === "," || char === "\n" || char === "\r" || char === " ")) {
      continue;
    }
    if (char === "(") depth++;
    if (char === ")") depth--;
    buffer += char;

    if (depth === 0 && buffer.trim().startsWith("(")) {
      rows.push(buffer.replace(/^[,(]+|[);]+$/g, ""));
      buffer = "";
    }
  }

  return rows.map((row) =>
    row
      .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
      .map((v) => (v === "NULL" ? null : v.replace(/^'|'$/g, "").replace(/\\'/g, "'")))
  );
}

const inserts = extractTableInserts("users");
let totalRows = 0;
inserts.forEach((ins, i) => {
  const rows = parseValues(ins);
  totalRows += rows.length;
  if (i === 0) {
    const valuesPart = ins.substring(ins.indexOf("VALUES") + 6);
    const open = (valuesPart.match(/\(/g) || []).length;
    const close = (valuesPart.match(/\)/g) || []).length;
    const separators = (valuesPart.match(/\),/g) || []).length;
    console.log(`block ${i + 1}: rows=${rows.length}, opens=${open}, closes=${close}, separators=${separators}`);
  } else {
    console.log(`block ${i + 1}: rows=${rows.length}`);
  }
});

console.log({ insertBlocks: inserts.length, totalRows });
