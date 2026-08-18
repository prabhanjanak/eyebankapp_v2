import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eyeCallsTable = pgTable("eye_calls", {
  id: serial("id").primaryKey(),
  callId: text("call_id").notNull().unique(),
  donorName: text("donor_name").notNull(),
  donorAge: integer("donor_age").notNull(),
  donorGender: text("donor_gender").notNull(),
  timeOfDeath: text("time_of_death").notNull(),
  causeOfDeath: text("cause_of_death").notNull(),
  referrerName: text("referrer_name").notNull(),
  referrerMobile: text("referrer_mobile").notNull(),
  referrerRelationship: text("referrer_relationship").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  pincode: text("pincode").notNull(),
  address: text("address").notNull(),
  unitId: integer("unit_id").notNull(),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  attendedByUserId: integer("attended_by_user_id"),
  thirdPartyHospitalDetails: text("third_party_hospital_details"),
  thirdPartyHelperContact: text("third_party_helper_contact"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEyeCallSchema = createInsertSchema(eyeCallsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEyeCall = z.infer<typeof insertEyeCallSchema>;
export type EyeCall = typeof eyeCallsTable.$inferSelect;
