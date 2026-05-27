const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const command = process.argv[2] || "help";
const serverDir = path.join(process.cwd(), "netplay-server");
const repoUrl = "https://github.com/EmulatorJS/EmulatorJS-Netplay.git";

function run(commandName, args, options = {}) {
  const result = spawnSync(commandName, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (command === "setup") {
  if (!fs.existsSync(serverDir)) {
    run("git", ["clone", repoUrl, serverDir]);
  }

  run("npm", ["install"], { cwd: serverDir });
  process.exit(0);
}

if (command === "start") {
  if (!fs.existsSync(serverDir)) {
    console.error("Missing netplay-server. Run: npm run netplay:setup");
    process.exit(1);
  }

  run("npm", ["start"], { cwd: serverDir });
  process.exit(0);
}

console.log("Usage:");
console.log("  npm run netplay:setup");
console.log("  npm run netplay:start");
