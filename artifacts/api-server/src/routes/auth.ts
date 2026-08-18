import { Router } from "express";
import { db, usersTable, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpdateProfileBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, signToken } from "../lib/crypto";
import { logActivity } from "../lib/auditLogger";
import { z } from "zod";

const router = Router();

const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ChangePasswordInputSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is deactivated. Contact MHQ admin." });
    return;
  }

  const token = signToken({ id: user.id });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  let unitName: string | null = null;
  if (user.unitId) {
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, user.unitId));
    unitName = unit?.name ?? null;
  }

  await logActivity(req, {
    action: "LOGIN",
    entityType: "auth",
    entityId: String(user.id),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    description: `${user.name} (${user.email}) signed in`,
    details: { role: user.role, unitId: user.unitId, unitName },
  });

  res.json({
    token,
    id: user.id,
    clerkId: user.clerkId || "local_auth",
    email: user.email,
    name: user.name,
    role: user.role,
    unitId: user.unitId,
    unitName,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  if (user) {
    await logActivity(req, {
      action: "LOGOUT",
      entityType: "auth",
      entityId: String(user.id),
      description: `${user.name} signed out`,
    });
  }

  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  const parsed = ChangePasswordInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { oldPassword, newPassword } = parsed.data;

  if (!user.passwordHash || !verifyPassword(oldPassword, user.passwordHash)) {
    res.status(400).json({ error: "Invalid current password" });
    return;
  }

  await db
    .update(usersTable)
    .set({
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
    })
    .where(eq(usersTable.id, user.id));

  await logActivity(req, {
    action: "PASSWORD_CHANGED",
    entityType: "auth",
    entityId: String(user.id),
    description: `${user.name} updated their password`,
  });

  res.json({ message: "Password changed successfully" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;

  let unitName: string | null = null;
  if (user.unitId) {
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, user.unitId));
    unitName = unit?.name ?? null;
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId || "local_auth",
    email: user.email,
    name: user.name,
    role: user.role,
    unitId: user.unitId,
    unitName,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  });
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, user.id))
    .returning();

  let unitName: string | null = null;
  if (updated.unitId) {
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, updated.unitId));
    unitName = unit?.name ?? null;
  }

  res.json({
    id: updated.id,
    clerkId: updated.clerkId || "local_auth",
    email: updated.email,
    name: updated.name,
    role: updated.role,
    unitId: updated.unitId,
    unitName,
    isActive: updated.isActive,
    mustChangePassword: updated.mustChangePassword,
  });
});

export default router;
