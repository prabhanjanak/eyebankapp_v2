import { Router } from "express";
import { db, usersTable, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import { hashPassword } from "../lib/crypto";
import { logActivity } from "../lib/auditLogger";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  ToggleUserActiveParams,
  ResetUserPasswordParams,
  ResetUserPasswordBody,
} from "@workspace/api-zod";

const router = Router();

async function attachUnitName(user: typeof usersTable.$inferSelect) {
  let unitName: string | null = null;
  if (user.unitId) {
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, user.unitId));
    unitName = unit?.name ?? null;
  }
  return { ...user, unitName };
}

router.get("/users", requireAuth, requireRole("super_admin"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const usersWithUnits = await Promise.all(users.map(attachUnitName));
  res.json(usersWithUnits);
});

router.post("/users", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, name, role, unitId, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) {
    res.status(400).json({ error: "User with this email already exists" });
    return;
  }

  const finalPassword = password || "Welcome@123";
  const pwdHash = hashPassword(finalPassword);

  const [user] = await db
    .insert(usersTable)
    .values({
      clerkId: "local_auth",
      email: email.toLowerCase().trim(),
      name,
      role: role ?? "unit_coordinator",
      unitId: unitId ?? null,
      passwordHash: pwdHash,
      mustChangePassword: true,
      isActive: true,
    })
    .returning();

  const admin = (req as any).appUser;
  await logActivity(req, {
    action: "USER_CREATED",
    entityType: "user",
    entityId: String(user.id),
    description: `${admin?.name || "Admin"} created new user ${user.name} (${user.email}) with role ${user.role}`,
    details: { userId: user.id, email: user.email, name: user.name, role: user.role, unitId: user.unitId },
  });

  res.status(201).json(await attachUnitName(user));
});

router.get("/users/:id", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(await attachUnitName(user));
});

router.patch("/users/:id", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const admin = (req as any).appUser;
  await logActivity(req, {
    action: "USER_UPDATED",
    entityType: "user",
    entityId: String(user.id),
    description: `${admin?.name || "Admin"} updated profile for user ${user.name} (${user.email})`,
    details: parsed.data,
  });

  res.json(await attachUnitName(user));
});

router.delete("/users/:id", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const admin = (req as any).appUser;
  await logActivity(req, {
    action: "USER_DELETED",
    entityType: "user",
    entityId: String(user.id),
    description: `${admin?.name || "Admin"} deleted user ${user.name} (${user.email})`,
    details: { email: user.email, name: user.name },
  });

  res.sendStatus(204);
});

router.patch("/users/:id/toggle-active", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = ToggleUserActiveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newActive = !existing.isActive;

  const [user] = await db
    .update(usersTable)
    .set({ isActive: newActive })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  const admin = (req as any).appUser;
  await logActivity(req, {
    action: newActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "user",
    entityId: String(user.id),
    description: `${admin?.name || "Admin"} ${newActive ? "activated" : "deactivated"} user account for ${user.name} (${user.email})`,
    details: { isActive: newActive },
  });

  res.json(await attachUnitName(user));
});

router.post("/users/:id/reset-password", requireAuth, requireRole("super_admin"), async (req, res): Promise<void> => {
  const params = ResetUserPasswordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ResetUserPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const pwdHash = hashPassword(parsed.data.newPassword);
  await db
    .update(usersTable)
    .set({
      passwordHash: pwdHash,
      mustChangePassword: true,
    })
    .where(eq(usersTable.id, params.data.id));

  const admin = (req as any).appUser;
  await logActivity(req, {
    action: "USER_PASSWORD_RESET",
    entityType: "user",
    entityId: String(user.id),
    description: `${admin?.name || "Admin"} reset password for user ${user.name} (${user.email})`,
    details: { userId: user.id, email: user.email },
  });

  res.json({ message: "Password updated successfully." });
});

export default router;
