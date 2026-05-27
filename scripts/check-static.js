const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "service-worker.js",
  "icons/icon.svg",
  "icons/icon.ico",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

const publicDir = path.join(process.cwd(), "public");
const missing = requiredFiles.filter((file) => {
  return !fs.existsSync(path.join(publicDir, file));
});

if (missing.length > 0) {
  console.error(`Missing static files: ${missing.join(", ")}`);
  process.exit(1);
}

JSON.parse(fs.readFileSync(path.join(publicDir, "manifest.webmanifest"), "utf8"));
JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"));

console.log("Static build check passed.");
