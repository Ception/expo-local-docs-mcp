#!/usr/bin/env node
// Post-build script to add shebang to the built server.js file
import { readFileSync, writeFileSync, chmodSync } from "fs";
import { resolve } from "path";

const serverPath = resolve("dist/server.js");

try {
  let content = readFileSync(serverPath, "utf-8");

  // Add shebang if not present
  if (!content.startsWith("#!")) {
    content = "#!/usr/bin/env node\n" + content;
    writeFileSync(serverPath, content, "utf-8");
    console.log("✓ Added shebang to dist/server.js");
  }

  // Make executable
  chmodSync(serverPath, 0o755);
  console.log("✓ Made dist/server.js executable");
} catch (error) {
  console.error("Failed to add shebang:", error.message);
  process.exit(1);
}
