/* eslint-disable @typescript-eslint/no-require-imports */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function runStep(label, command, args, options = {}) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    const error = new Error(`${label} failed with exit code ${result.status}`);
    error.exitCode = result.status;
    throw error;
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  process.chdir(repoRoot);

  const markerPath = path.join(repoRoot, "ci-test.exit.txt");
  try {
    fs.rmSync(markerPath, { force: true });
  } catch {
    // ignore
  }

  const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
  const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

  fs.rmSync(path.join(repoRoot, ".next"), { recursive: true, force: true });

  runStep("Lint", process.execPath, [nextBin, "lint"]);
  runStep("Type-check", process.execPath, [tscBin, "--noEmit"]);
  runStep("Build", process.execPath, ["--max-old-space-size=6144", nextBin, "build"]);

  process.stdout.write("\nCI OK\n");

  fs.writeFileSync(markerPath, "OK\n", "utf8");
}

try {
  main();
} catch (error) {
  const exitCode = error && typeof error.exitCode === "number" ? error.exitCode : 1;
  process.stderr.write(`\nCI FAILED: ${error?.message ?? String(error)}\n`);

  try {
    const repoRoot = path.resolve(__dirname, "..");
    fs.writeFileSync(
      path.join(repoRoot, "ci-test.exit.txt"),
      `FAIL exitCode=${exitCode}\n${error?.message ?? String(error)}\n`,
      "utf8"
    );
  } catch {
    // ignore
  }
  process.exit(exitCode);
}
