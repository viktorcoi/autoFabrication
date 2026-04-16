const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const targetSets = {
  all: [".next", "src/client/.next", "src/server/dist"],
  client: ["src/client/.next"],
  server: ["src/server/dist"],
};

const scope = process.argv[2] || "all";
const targets = targetSets[scope];

if (!targets) {
  console.error(`Unknown clean scope: ${scope}`);
  process.exit(1);
}

for (const relativeTarget of targets) {
  fs.rmSync(path.join(rootDir, relativeTarget), {
    recursive: true,
    force: true,
  });
}
