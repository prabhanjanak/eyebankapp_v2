import { Router } from "express";
import { db, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import {
  CreateUnitBody,
  UpdateUnitBody,
  GetUnitParams,
  UpdateUnitParams,
  DeleteUnitParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/units", async (_req, res): Promise<void> => {
  const units = await db.select().from(unitsTable).orderBy(unitsTable.name);
  res.json(units);
});

router.post("/units", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const parsed = CreateUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db.insert(unitsTable).values(parsed.data).returning();
  res.status(201).json(unit);
});

router.get("/units/:id", async (req, res): Promise<void> => {
  const params = GetUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, params.data.id));
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(unit);
});

router.patch("/units/:id", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = UpdateUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db
    .update(unitsTable)
    .set(parsed.data)
    .where(eq(unitsTable.id, params.data.id))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(unit);
});

router.delete("/units/:id", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = DeleteUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [unit] = await db.delete(unitsTable).where(eq(unitsTable.id, params.data.id)).returning();
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
