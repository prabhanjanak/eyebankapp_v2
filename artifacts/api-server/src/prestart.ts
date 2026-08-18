import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

// We check multiple locations to reliably locate the .env file in dev or workspace root:
const possiblePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
];

try {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  possiblePaths.push(path.resolve(currentDir, "../../.env"));
  possiblePaths.push(path.resolve(currentDir, "../../../.env"));
} catch (e) {
  // Ignore in environments where import.meta.url is not available (though it is here)
}

let loaded = false;
for (const envPath of possiblePaths) {
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const firstEqual = trimmed.indexOf("=");
        if (firstEqual === -1) continue;
        const key = trimmed.slice(0, firstEqual).trim();
        const val = trimmed.slice(firstEqual + 1).trim();
        // Set if not already set, or overwrite to make sure it is updated
        process.env[key] = val;
      }
      console.log(`[API Prestart] Successfully loaded environment from ${envPath}`);
      loaded = true;
      break;
    }
  } catch (err) {
    // Ignore and try next path
  }
}

if (!loaded) {
  console.warn("[API Prestart] Warning: No .env file was successfully loaded. If database connection fails, verify your environment settings.");
}
