import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

// Load root .env manually using process.cwd() to avoid CJS/ESM interop issues
try {
  // drizzle-kit is executed from lib/db, so process.cwd() is that folder
  const envPath = path.resolve(process.cwd(), "../../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const firstEqual = trimmed.indexOf("=");
      if (firstEqual === -1) continue;
      process.env[trimmed.slice(0, firstEqual).trim()] = trimmed.slice(firstEqual + 1).trim();
    }
  } else {
    console.warn("No .env found at", envPath);
  }
} catch (e) {
  console.error("Error loading .env", e);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

