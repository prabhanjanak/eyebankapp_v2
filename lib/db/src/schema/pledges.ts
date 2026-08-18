import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pledgesTable = pgTable("pledges", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  bloodGroup: text("blood_group"),
  secureToken: text("secure_token").notNull().default(sql`substring(md5(random()::text), 1, 16)`),
  isCertificateSent: boolean("is_certificate_sent").notNull().default(false),
  pledgedAt: timestamp("pledged_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPledgeSchema = createInsertSchema(pledgesTable).omit({ id: true, isCertificateSent: true, pledgedAt: true, createdAt: true, updatedAt: true });
export type InsertPledge = z.infer<typeof insertPledgeSchema>;
export type Pledge = typeof pledgesTable.$inferSelect;
