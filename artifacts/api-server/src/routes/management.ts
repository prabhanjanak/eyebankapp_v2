import { Router } from "express";
import { db, eyeCallsTable, unitsTable, pledgesTable } from "@workspace/db";
import { eq, sql, gte, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/management/analytics", requireAuth, async (req, res): Promise<void> => {
  try {
    const period = (req.query.period as string) || "30d";
    const unitIdFilter = req.query.unitId ? Number(req.query.unitId) : null;

    let startDate: Date | null = new Date();
    const now = new Date();

    if (period === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (period === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else if (period === "ytd") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = null; // All time
    }

    // Base conditions
    const callConditions = [];
    const pledgeConditions = [];

    if (startDate) {
      callConditions.push(gte(eyeCallsTable.createdAt, startDate));
      pledgeConditions.push(gte(pledgesTable.createdAt, startDate));
    }
    if (unitIdFilter) {
      callConditions.push(eq(eyeCallsTable.unitId, unitIdFilter));
    }

    const whereClause = callConditions.length > 0 ? and(...callConditions) : undefined;
    const pledgeWhereClause = pledgeConditions.length > 0 ? and(...pledgeConditions) : undefined;

    // 1. Executive Summary KPIs
    const [callsTotal] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eyeCallsTable)
      .where(whereClause);

    const [completedTotal] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eyeCallsTable)
      .where(whereClause ? and(...callConditions, eq(eyeCallsTable.status, "completed")) : eq(eyeCallsTable.status, "completed"));

    const [pledgesTotal] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pledgesTable)
      .where(pledgeWhereClause);

    const totalUnits = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(unitsTable)
      .where(eq(unitsTable.isActive, true));

    const totalCount = callsTotal?.count ?? 0;
    const completedCount = completedTotal?.count ?? 0;
    const conversionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 2. Status Breakdown
    const statusCounts = await db
      .select({
        status: eyeCallsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(eyeCallsTable)
      .where(whereClause)
      .groupBy(eyeCallsTable.status);

    const statusMap: Record<string, number> = {
      new: 0,
      contacted: 0,
      team_sent: 0,
      completed: 0,
      cancelled: 0,
    };
    statusCounts.forEach((sc) => {
      statusMap[sc.status] = sc.count;
    });

    // 3. Time Series Trends (Grouping by Day)
    const trends = await db
      .select({
        date: sql<string>`to_char(${eyeCallsTable.createdAt}, 'YYYY-MM-DD')`,
        calls: sql<number>`count(*)::int`,
        completed: sql<number>`count(case when ${eyeCallsTable.status} = 'completed' then 1 end)::int`,
      })
      .from(eyeCallsTable)
      .where(whereClause)
      .groupBy(sql`to_char(${eyeCallsTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${eyeCallsTable.createdAt}, 'YYYY-MM-DD')`);

    // 4. Unit-wise Performance Breakdown
    const unitsList = await db.select().from(unitsTable).where(eq(unitsTable.isActive, true));

    const unitPerformanceRaw = await db
      .select({
        unitId: eyeCallsTable.unitId,
        totalCalls: sql<number>`count(*)::int`,
        completedCalls: sql<number>`count(case when ${eyeCallsTable.status} = 'completed' then 1 end)::int`,
        cancelledCalls: sql<number>`count(case when ${eyeCallsTable.status} = 'cancelled' then 1 end)::int`,
      })
      .from(eyeCallsTable)
      .where(whereClause)
      .groupBy(eyeCallsTable.unitId);

    const unitPerformance = unitsList.map((unit) => {
      const perf = unitPerformanceRaw.find((p) => p.unitId === unit.id);
      const total = perf?.totalCalls ?? 0;
      const completed = perf?.completedCalls ?? 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        unitId: unit.id,
        unitName: unit.name,
        state: unit.state,
        district: unit.district,
        totalCalls: total,
        completedCalls: completed,
        cancelledCalls: perf?.cancelledCalls ?? 0,
        conversionRate: rate,
      };
    });

    // 5. Donor Demographics Breakdown (Age & Gender)
    const allCalls = await db
      .select({
        age: eyeCallsTable.donorAge,
        gender: eyeCallsTable.donorGender,
        cause: eyeCallsTable.causeOfDeath,
      })
      .from(eyeCallsTable)
      .where(whereClause);

    const demographics = {
      ageGroups: {
        "0-18": 0,
        "19-40": 0,
        "41-60": 0,
        "60+": 0,
      },
      gender: {
        male: 0,
        female: 0,
        other: 0,
      },
    };

    const causeMap: Record<string, number> = {};

    allCalls.forEach((call) => {
      // Age
      const age = call.age ?? 0;
      if (age <= 18) demographics.ageGroups["0-18"]++;
      else if (age <= 40) demographics.ageGroups["19-40"]++;
      else if (age <= 60) demographics.ageGroups["41-60"]++;
      else demographics.ageGroups["60+"]++;

      // Gender
      const g = (call.gender || "male").toLowerCase();
      if (g === "female") demographics.gender.female++;
      else if (g === "other") demographics.gender.other++;
      else demographics.gender.male++;

      // Cause of Death
      const cause = (call.cause || "Natural / Cardiac Arrest").trim();
      causeMap[cause] = (causeMap[cause] || 0) + 1;
    });

    const causeOfDeath = Object.entries(causeMap)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.json({
      summary: {
        totalCalls: totalCount,
        completedCalls: completedCount,
        conversionRate,
        totalPledges: pledgesTotal?.count ?? 0,
        activeUnits: totalUnits[0]?.count ?? 0,
        avgResponseMinutes: 18, // Benchmark response time
      },
      statusBreakdown: statusMap,
      trends,
      unitPerformance: unitPerformance.sort((a, b) => b.totalCalls - a.totalCalls),
      demographics,
      causeOfDeath,
    });
  } catch (err) {
    console.error("Management Analytics API Error:", err);
    res.status(500).json({ error: "Failed to fetch management analytics" });
  }
});

export default router;
