import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { desc, eq, and, sql, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/audit-logs", requireAuth, async (req, res): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const offset = (page - 1) * limit;

    const action = req.query.action as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const clientApp = req.query.clientApp as string | undefined;
    const userIdStr = req.query.userId as string | undefined;
    const search = req.query.search as string | undefined;

    const conditions = [];

    if (action && action !== "all") {
      conditions.push(eq(auditLogsTable.action, action));
    }
    if (entityType && entityType !== "all") {
      conditions.push(eq(auditLogsTable.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(auditLogsTable.entityId, entityId));
    }
    if (clientApp && clientApp !== "all") {
      conditions.push(eq(auditLogsTable.clientApp, clientApp));
    }
    if (userIdStr) {
      const uId = parseInt(userIdStr, 10);
      if (!isNaN(uId)) {
        conditions.push(eq(auditLogsTable.userId, uId));
      }
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(auditLogsTable.description, term),
          ilike(auditLogsTable.userName, term),
          ilike(auditLogsTable.userEmail, term),
          ilike(auditLogsTable.entityId, term),
          ilike(auditLogsTable.action, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogsTable)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(whereClause)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

router.get("/audit-logs/stats", requireAuth, async (_req, res): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogsTable)
      .where(sql`${auditLogsTable.createdAt} >= ${today.toISOString()}`);

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogsTable);

    const actionCounts = await db
      .select({
        action: auditLogsTable.action,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogsTable)
      .groupBy(auditLogsTable.action)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const userActivity = await db
      .select({
        userName: auditLogsTable.userName,
        userEmail: auditLogsTable.userEmail,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogsTable)
      .groupBy(auditLogsTable.userName, auditLogsTable.userEmail)
      .orderBy(desc(sql`count(*)`))
      .limit(8);

    const clientCounts = await db
      .select({
        clientApp: auditLogsTable.clientApp,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogsTable)
      .groupBy(auditLogsTable.clientApp);

    res.json({
      todayCount: todayCountResult?.count ?? 0,
      totalCount: totalCountResult?.count ?? 0,
      actionCounts,
      userActivity,
      clientCounts,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit stats" });
  }
});

router.get("/audit-logs/by-call/:callId", requireAuth, async (req, res): Promise<void> => {
  try {
    const callId = String(req.params.callId || "");
    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(
        or(
          eq(auditLogsTable.entityId, callId),
          ilike(auditLogsTable.description, `%${callId}%`)
        )
      )
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(50);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch call audit history" });
  }
});

export default router;
