import { buildSamplePluginBundle } from "./lib/samplePluginBundle";

const result = buildSamplePluginBundle();

console.log(`Built sample plugin artifact: ${result.artifactPath}`);
console.log(`Archive SHA-256: ${result.archiveSha256}`);