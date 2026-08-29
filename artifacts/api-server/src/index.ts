import "./prestart";
import app from "./app";
import { logger } from "./lib/logger";
import { db, pool, usersTable, unitsTable } from "@workspace/db";
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

const DEFAULT_UNITS = [
  {
    name: "Sankara Eye Hospital - Kanpur",
    state: "Uttar Pradesh",
    district: "Kanpur",
    address: "Off GT Road, PO Amiliha, Tatiyaganj, Kanpur, Uttar Pradesh 209203",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Coimbatore",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "16-A, Sathy Rd, near Prozone Mall, Saravanampatti, Siranandha Puram, Coimbatore, Tamil Nadu 641035",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Guntur",
    state: "Andhra Pradesh",
    district: "Guntur",
    address: "Guntur - Vijayawada Hwy, Pedakakani, Andhra Pradesh 522509",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Anand",
    state: "Gujarat",
    district: "Anand",
    address: "NH64, Ramdev Society, Mogar, Gujarat 388340",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Bangalore",
    state: "Karnataka",
    district: "Bengaluru",
    address: "Varthur Main Rd, Vaikuntam Layout, Lakshminarayana Pura, Kundalahalli, Munnekolala, Bengaluru, Karnataka 560037",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Shimoga",
    state: "Karnataka",
    district: "Shivamogga",
    address: "Thirthahalli, Gandharva Nagara Rd, Harakere, Shivamogga, Karnataka 577202",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Hyderabad",
    state: "Telangana",
    district: "Hyderabad",
    address: "Financial District, Nanakramguda, Telangana 500032",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Indore",
    state: "Madhya Pradesh",
    district: "Indore",
    address: "Vijay Nagar Main Rd, Scheme No 74C, Indore, Madhya Pradesh 452010",
    isActive: true,
  },
  {
    name: "RJ Sankara Eye Hospital - Panvel",
    state: "Maharashtra",
    district: "Panvel",
    address: "Plot No 12, Sector 5A, Sector 6, New Panvel East, Panvel, Maharashtra 410206",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Ludhiana",
    state: "Punjab",
    district: "Ludhiana",
    address: "Vipul World Village Bhanohar, Post Dhaka, Ferozepur - Ludhiana Rd, near Wadi Haveli, Ludhiana, Punjab 141102",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Krishnankoil",
    state: "Tamil Nadu",
    district: "Krishnan Kovil",
    address: "Kunnur PO, Srivilliputhur Taluk, Krishnan Kovil, Tamil Nadu 626126",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Varanasi",
    state: "Uttar Pradesh",
    district: "Varanasi",
    address: "Plot No 193 & 194, Ring Road Phase-I, Madhopur, Varanasi, Uttar Pradesh 221003",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Jaipur",
    state: "Rajasthan",
    district: "Jaipur",
    address: "6, Central Spine Rd, Sector 2, Sector 6, Vidyadhar Nagar, Jaipur, Rajasthan 302039",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - RS Puram CBE",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "Srivari Kikani Centre, Dr Krishnasamy Mudaliyar Rd, next to Chinthamani Super Market, Sukrawar Pettai, R.S. Puram, Coimbatore, Tamil Nadu 641002",
    isActive: true,
  },
  {
    name: "SEFI MHQ - Mission Head Quarters",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "16-A, Sathy Rd, near Prozone Mall, Saravanampatti, Siranandha Puram, Coimbatore, Tamil Nadu 641035",
    isActive: true,
  }
];

async function ensureHospitalUnits() {
  try {
    for (const unit of DEFAULT_UNITS) {
      const existing = await db
        .select()
        .from(unitsTable)
        .where(eq(unitsTable.name, unit.name));

      if (existing.length === 0) {
        await db.insert(unitsTable).values({
          ...unit,
          coordinatorName: "Eye Bank Coordinator",
          coordinatorWhatsapp: "+91 9000019190",
          isActive: true,
        });
        logger.info(`Successfully seeded hospital unit: ${unit.name}`);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error checking or seeding hospital units");
  }
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
      {
        email: "dean@sankaraeye.com",
        name: "Dean / Executive Management",
        role: "management",
        password: "Dean@2026",
        clerkId: "local_auth_dean",
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
  await ensureHospitalUnits();

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
