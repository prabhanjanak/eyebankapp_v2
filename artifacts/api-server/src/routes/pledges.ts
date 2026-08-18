import { Router } from "express";
import { db, pledgesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { sendPledgeCertificate } from "../services/notifications";
import { generatePledgePdf } from "../services/pdfGenerator";
import { z } from "zod/v4";

const router = Router();

const CreatePledgeBody = z.object({
  fullName: z.string().min(2, "Name is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(5, "Address is required"),
  dateOfBirth: z.string().min(4, "Date of birth is required"),
  bloodGroup: z.string().optional(),
});

// GET /pledges - List all pledges (MHQ only)
router.get("/pledges", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  // Check if MHQ or Super Admin. We assume Super Admin can view, or a specific unit ID.
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Only MHQ Administrators can access pledges" });
    return;
  }

  const pledges = await db
    .select()
    .from(pledgesTable)
    .orderBy(desc(pledgesTable.createdAt));

  res.json({ data: pledges });
});

// POST /pledges - Public route to register a pledge
router.post("/pledges", async (req, res): Promise<void> => {
  const parsed = CreatePledgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const [pledge] = await db
    .insert(pledgesTable)
    .values(parsed.data)
    .returning();

  // Automatically trigger certificate sending via Email and WhatsApp on pledge submission
  try {
    await sendPledgeCertificate(pledge);
    // Mark certificate as sent in the database
    await db
      .update(pledgesTable)
      .set({ isCertificateSent: true })
      .where(eq(pledgesTable.id, pledge.id));
    
    // Fetch the updated record to return
    const [updatedPledge] = await db
      .select()
      .from(pledgesTable)
      .where(eq(pledgesTable.id, pledge.id));
    
    res.status(201).json(updatedPledge || pledge);
  } catch (err) {
    console.error("Failed to automatically send pledge certificate:", err);
    // Still return 201 as the database record was successfully created
    res.status(201).json(pledge);
  }
});

// POST /pledges/:id/certificate - Generate and send certificate
router.post("/pledges/:id/certificate", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Only MHQ Administrators can send certificates" });
    return;
  }

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid pledge ID" });
    return;
  }

  const [pledge] = await db.select().from(pledgesTable).where(eq(pledgesTable.id, id));
  if (!pledge) {
    res.status(404).json({ error: "Pledge not found" });
    return;
  }

  try {
    await sendPledgeCertificate(pledge);
    
    // Update status
    const [updated] = await db
      .update(pledgesTable)
      .set({ isCertificateSent: true })
      .where(eq(pledgesTable.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Failed to send certificate:", error);
    res.status(500).json({ error: "Failed to send certificate" });
  }
});

// GET /public/pledges/c/:token - Public route to download/view the certificate by secure token
router.get("/public/pledges/c/:token", async (req, res): Promise<void> => {
  const { token } = req.params;
  if (!token || token.length !== 16) {
    res.status(400).send("Invalid certificate link");
    return;
  }

  try {
    const [pledge] = await db
      .select()
      .from(pledgesTable)
      .where(eq(pledgesTable.secureToken, token));

    if (!pledge) {
      res.status(404).send("Certificate not found");
      return;
    }

    // Generate PDF
    const pdfBuffer = await generatePledgePdf(pledge);
    
    // Set headers to display PDF inline in the browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Sankara_Eye_Pledge_${pledge.id.toString().padStart(5, '0')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Failed to generate public certificate view:", err);
    res.status(500).send("Internal Server Error");
  }
});

// DELETE /pledges/:id - Super Admin only
router.delete("/pledges/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Only Super Admins can delete pledge entries" });
    return;
  }

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid pledge ID" });
    return;
  }

  const [existing] = await db.select().from(pledgesTable).where(eq(pledgesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Pledge not found" });
    return;
  }

  await db.delete(pledgesTable).where(eq(pledgesTable.id, id));
  res.json({ success: true, message: `Pledge #P${id} deleted successfully` });
});

export default router;
