import "./prestart";
import app from "./app";
import { logger } from "./lib/logger";
import { db, pool, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./lib/crypto";

// Validate Required Environment Variables
if (!process.env.DATABASE_URL) {
  logger.fatal("FATAL ERROR: DATABASE_URL is not configured in .env file.");
  logger.fatal("Please set DATABASE_URL=postgresql://user:password@host:port/dbname in .env");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("secret-key"))) {
  logger.warn("WARNING: JWT_SECRET is using a default or insecure value in production. Please set a strong random JWT_SECRET in .env.");
}

const rawPort = process.env["PORT"] || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.fatal(`FATAL ERROR: Invalid PORT value "${rawPort}". Please provide a valid port number.`);
  process.exit(1);
}

async function ensureSuperAdmin() {
  try {
    const seedUsers = [
      {
        email: "admin@sankaraeye.com",
        name: "MHQ Admin",
        role: "super_admin",
        password: "Welcome@123",
        clerkId: "local_auth_admin",
        mustChangePassword: true,
      },
      {
        email: "saravanan@sankaraeye.com",
        name: "Saravanan",
        role: "super_admin",
        password: "Saravanan@2026",
        clerkId: "local_auth_saravanan",
        mustChangePassword: false,
      },
      {
        email: "prabhanjan@sankaraeye.com",
        name: "Prabhanjan",
        role: "super_admin",
        password: "Prabhanjan@2026",
        clerkId: "local_auth_prabhanjan",
        mustChangePassword: false,
      },
      {
        email: "sivaprakash@sankaraeye.com",
        name: "Sivaprakash",
        role: "super_admin",
        password: "Sivaprakash@2026",
        clerkId: "local_auth_sivaprakash",
        mustChangePassword: false,
      },
    ];

    for (const u of seedUsers) {
      const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, u.email.toLowerCase().trim()));

      const pwdHash = hashPassword(u.password);

      if (existing.length === 0) {
        await db.insert(usersTable).values({
          clerkId: u.clerkId,
          email: u.email.toLowerCase().trim(),
          name: u.name,
          role: u.role,
          passwordHash: pwdHash,
          mustChangePassword: u.mustChangePassword,
          isActive: true,
        });
        logger.info(`Successfully created user: ${u.email}`);
      } else {
        await db
          .update(usersTable)
          .set({
            passwordHash: pwdHash,
            mustChangePassword: u.mustChangePassword,
            isActive: true,
          })
          .where(eq(usersTable.email, u.email.toLowerCase().trim()));
        logger.info(`Successfully synced credentials for user: ${u.email}`);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error checking or seeding super_admins / coordinators");
  }
}

async function start() {
  await ensureSuperAdmin();

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, host: "0.0.0.0", env: process.env.NODE_ENV || "development" }, `Sankara Eye Bank Server started successfully on port ${port}`);
  });

  // PM2 and Linux Graceful Shutdown
  let isShuttingDown = false;
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, "Error closing HTTP server");
      } else {
        logger.info("HTTP server closed.");
      }

      try {
        await pool.end();
        logger.info("Database connection pool closed successfully.");
      } catch (poolErr) {
        logger.error({ err: poolErr }, "Error closing database pool");
      }

      logger.info("Graceful shutdown complete. Exiting process.");
      process.exit(0);
    });

    // Fallback force shutdown timeout (10 seconds)
    setTimeout(() => {
      logger.warn("Forced process exit after graceful shutdown timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

start().catch((err) => {
  logger.fatal({ err }, "FATAL: Error during application startup");
  process.exit(1);
});
