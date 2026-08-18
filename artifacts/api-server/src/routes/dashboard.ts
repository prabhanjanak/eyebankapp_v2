import { Router } from "express";
import { db, eyeCallsTable, unitsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { GetRecentCallsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (_req, res): Promise<void> => {
  const totalCalls = await db.select({ count: sql<number>`count(*)::int` }).from(eyeCallsTable);
  const newCalls = await db.select({ count: sql<number>`count(*)::int` }).from(eyeCallsTable).where(eq(eyeCallsTable.status, "new"));
  const contactedCalls = await db.select({ count: sql<number>`count(*)::int` }).from(eyeCallsTable).where(eq(eyeCallsTable.status, "contacted"));
  const teamSentCalls = await db.select({ count: sql<number>`count(*)::int` }).from(eyeCallsTable).where(eq(eyeCallsTable.status, "team_sent"));
  const completedCalls = await db.select({ count: sql<number>`count(*)::int` }).from(eyeCallsTable).where(eq(eyeCallsTable.status, "completed"));
  const cancelledCalls = await db.select({ count: sql<number>`count(*)::int` }).from(eyeCallsTable).where(eq(eyeCallsTable.status, "cancelled"));
  const totalUnits = await db.select({ count: sql<number>`count(*)::int` }).from(unitsTable);
  const activeUnits = await db.select({ count: sql<number>`count(*)::int` }).from(unitsTable).where(eq(unitsTable.isActive, true));

  res.json({
    totalCalls: totalCalls[0]?.count ?? 0,
    newCalls: newCalls[0]?.count ?? 0,
    contactedCalls: contactedCalls[0]?.count ?? 0,
    teamSentCalls: teamSentCalls[0]?.count ?? 0,
    completedCalls: completedCalls[0]?.count ?? 0,
    cancelledCalls: cancelledCalls[0]?.count ?? 0,
    totalUnits: totalUnits[0]?.count ?? 0,
    activeUnits: activeUnits[0]?.count ?? 0,
  });
});

router.get("/dashboard/recent-calls", requireAuth, async (req, res): Promise<void> => {
  const queryParams = GetRecentCallsQueryParams.safeParse(req.query);
  const limit = queryParams.success ? (queryParams.data.limit ?? 10) : 10;

  const calls = await db
    .select()
    .from(eyeCallsTable)
    .orderBy(sql`${eyeCallsTable.createdAt} DESC`)
    .limit(limit);

  const callsWithUnits = await Promise.all(
    calls.map(async (call) => {
      const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, call.unitId));
      return { ...call, unitName: unit?.name ?? "Unknown" };
    }),
  );

  res.json(callsWithUnits);
});

router.get("/dashboard/calls-by-unit", requireAuth, async (_req, res): Promise<void> => {
  const result = await db
    .select({
      unitId: eyeCallsTable.unitId,
      count: sql<number>`count(*)::int`,
    })
    .from(eyeCallsTable)
    .groupBy(eyeCallsTable.unitId);

  const withUnitNames = await Promise.all(
    result.map(async (row) => {
      const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, row.unitId));
      return { unitId: row.unitId, unitName: unit?.name ?? "Unknown", count: row.count };
    }),
  );

  res.json(withUnitNames);
});

router.get("/dashboard/calls-by-status", requireAuth, async (_req, res): Promise<void> => {
  const result = await db
    .select({
      status: eyeCallsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(eyeCallsTable)
    .groupBy(eyeCallsTable.status);

  res.json(result);
});

export default router;
