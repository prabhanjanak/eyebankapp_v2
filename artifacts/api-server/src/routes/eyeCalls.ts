import { Router } from "express";
import { db, eyeCallsTable, unitsTable, usersTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { notifyReferrerOfThirdPartyAssignment } from "../services/notifications";
import { logActivity } from "../lib/auditLogger";
import {
  CreateEyeCallBody,
  UpdateEyeCallBody,
  UpdateEyeCallStatusBody,
  GetEyeCallParams,
  UpdateEyeCallParams,
  DeleteEyeCallParams,
  UpdateEyeCallStatusParams,
  ListEyeCallsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function generateCallId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EC${year}${month}${day}${rand}`;
}

async function attachUnitName(call: typeof eyeCallsTable.$inferSelect) {
  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, call.unitId));
  return { ...call, unitName: unit?.name ?? "Unknown" };
}

router.get("/eye-calls", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  const queryParams = ListEyeCallsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { status, unitId, search, page = 1, limit = 20 } = queryParams.data;

  let query = db.select().from(eyeCallsTable);
  const conditions = [];

  // Unit coordinators can only see their unit's calls
  if (user.role === "unit_coordinator" && user.unitId) {
    conditions.push(eq(eyeCallsTable.unitId, user.unitId));
  } else if (unitId) {
    conditions.push(eq(eyeCallsTable.unitId, unitId));
  }

  if (status) {
    conditions.push(eq(eyeCallsTable.status, status));
  }

  if (search) {
    conditions.push(
      or(
        ilike(eyeCallsTable.donorName, `%${search}%`),
        ilike(eyeCallsTable.referrerName, `%${search}%`),
        ilike(eyeCallsTable.callId, `%${search}%`),
      )!,
    );
  }

  const baseQuery = conditions.length > 0 
    ? db.select().from(eyeCallsTable).where(and(...conditions))
    : db.select().from(eyeCallsTable);

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eyeCallsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * limit;

  const calls = await db
    .select()
    .from(eyeCallsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${eyeCallsTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const callsWithUnits = await Promise.all(calls.map(attachUnitName));

  res.json({ data: callsWithUnits, total, page, limit });
});

router.post("/eye-calls", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateEyeCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, parsed.data.unitId));
  if (!unit) {
    res.status(400).json({ error: "Unit not found" });
    return;
  }

  const [call] = await db
    .insert(eyeCallsTable)
    .values({ ...parsed.data, callId: generateCallId() })
    .returning();

  const user = (req as any).appUser;
  await logActivity(req, {
    action: "CALL_CREATED",
    entityType: "eye_call",
    entityId: call.callId,
    description: `${user?.name || "Coordinator"} registered emergency call for donor ${call.donorName} (${call.callId})`,
    details: {
      callId: call.callId,
      donorName: call.donorName,
      donorAge: call.donorAge,
      donorGender: call.donorGender,
      unitName: unit.name,
      referrerName: call.referrerName,
    },
  });

  // Notify coordinators via email and whatsapp
  try {
    const { broadcastOutofRegionAlert, notifyAssignedUnit } = await import("../services/notifications");
    if (unit.name.includes("MHQ") || unit.name.includes("Head Quarters") || unit.name.includes("Mission Head Quarters")) {
      broadcastOutofRegionAlert({ ...call }).catch(err => console.error("Failed to broadcast out of region alert", err));
    } else {
      notifyAssignedUnit({ ...call }, unit).catch(err => console.error("Failed to notify assigned unit", err));
    }
  } catch (err) {
    console.error("Failed to send manual call notifications:", err);
  }

  res.status(201).json(await attachUnitName(call));
});

router.get("/eye-calls/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetEyeCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [call] = await db.select().from(eyeCallsTable).where(eq(eyeCallsTable.id, params.data.id));
  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  res.json(await attachUnitName(call));
});

router.patch("/eye-calls/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEyeCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEyeCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [call] = await db
    .update(eyeCallsTable)
    .set(parsed.data)
    .where(eq(eyeCallsTable.id, params.data.id))
    .returning();

  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  const user = (req as any).appUser;
  await logActivity(req, {
    action: "CALL_UPDATED",
    entityType: "eye_call",
    entityId: call.callId,
    description: `${user?.name || "Coordinator"} updated call details for ${call.donorName} (${call.callId})`,
    details: parsed.data,
  });

  // Trigger notification if third party details are assigned
  if (parsed.data.thirdPartyHospitalDetails || parsed.data.thirdPartyHelperContact) {
    // Fire and forget notification
    notifyReferrerOfThirdPartyAssignment(call).catch(console.error);
  }

  res.json(await attachUnitName(call));
});

router.delete("/eye-calls/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).appUser;
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Only admins can delete eye calls" });
    return;
  }

  const params = DeleteEyeCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [call] = await db.delete(eyeCallsTable).where(eq(eyeCallsTable.id, params.data.id)).returning();
  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  await logActivity(req, {
    action: "CALL_DELETED",
    entityType: "eye_call",
    entityId: call.callId,
    description: `${user.name} deleted emergency call ${call.callId} for donor ${call.donorName}`,
    details: { callId: call.callId, donorName: call.donorName },
  });

  res.sendStatus(204);
});

router.patch("/eye-calls/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEyeCallStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEyeCallStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [call] = await db
    .update(eyeCallsTable)
    .set(parsed.data)
    .where(eq(eyeCallsTable.id, params.data.id))
    .returning();

  if (!call) {
    res.status(404).json({ error: "Eye call not found" });
    return;
  }

  const user = (req as any).appUser;
  let actionName = "STATUS_CHANGE";
  let desc = `${user?.name || "Coordinator"} changed status of call ${call.callId} to ${parsed.data.status}`;

  if (parsed.data.status === "team_sent") {
    actionName = "DISPATCH_COORDINATOR";
    desc = `${user?.name || "Coordinator"} dispatched coordinator team for donor ${call.donorName} (${call.callId})`;
  } else if (parsed.data.status === "completed") {
    actionName = "CALL_COMPLETED";
    desc = `${user?.name || "Coordinator"} marked call ${call.callId} for ${call.donorName} as Completed / Done`;
  }

  await logActivity(req, {
    action: actionName,
    entityType: "eye_call",
    entityId: call.callId,
    description: desc,
    details: {
      callId: call.callId,
      donorName: call.donorName,
      newStatus: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  // Trigger automated notification dispatches to referrer based on status transitions
  try {
    const { notifyReferrerOfTeamDispatch, notifyReferrerOfStatusUpdate } = await import("../services/notifications");
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, call.unitId));
    
    if (parsed.data.status === "team_sent") {
      await notifyReferrerOfTeamDispatch(call, unit || { name: "Sankara Eye Bank Team" });
    } else {
      await notifyReferrerOfStatusUpdate(call, unit || { name: "Sankara Eye Bank" });
    }
  } catch (err) {
    console.error("Failed to send status update notifications to referrer:", err);
  }

  res.json(await attachUnitName(call));
});

router.all("/eye-calls/generate-dummy", async (req, res): Promise<void> => {
  const dummyCalls = [
    {
      donorName: "Ramesh Patel",
      donorAge: 68,
      donorGender: "male",
      timeOfDeath: "Today, 08:30 AM",
      causeOfDeath: "Natural Causes / Old Age",
      referrerName: "Suresh Patel",
      referrerMobile: "+91 9876543210",
      referrerRelationship: "Son",
      state: "Gujarat",
      district: "Anand",
      pincode: "388340",
      address: "Ramdev Society, Mogar, Anand",
    },
    {
      donorName: "Meenakshi Sundaram",
      donorAge: 72,
      donorGender: "female",
      timeOfDeath: "Today, 07:15 AM",
      causeOfDeath: "Cardiac Arrest",
      referrerName: "Karthik Sundaram",
      referrerMobile: "+91 9443219876",
      referrerRelationship: "Son",
      state: "Tamil Nadu",
      district: "Coimbatore",
      pincode: "641035",
      address: "16-A, Sathy Road, Saravanampatti, Coimbatore",
    },
    {
      donorName: "Venkata Rao",
      donorAge: 64,
      donorGender: "male",
      timeOfDeath: "Today, 09:00 AM",
      causeOfDeath: "Cardio-respiratory arrest",
      referrerName: "Lakshmi Rao",
      referrerMobile: "+91 9123456780",
      referrerRelationship: "Wife",
      state: "Andhra Pradesh",
      district: "Guntur",
      pincode: "522509",
      address: "Pedakakani, Guntur",
    },
    {
      donorName: "Sunita Sharma",
      donorAge: 59,
      donorGender: "female",
      timeOfDeath: "Today, 06:45 AM",
      causeOfDeath: "Respiratory Failure",
      referrerName: "Ankit Sharma",
      referrerMobile: "+91 9811223344",
      referrerRelationship: "Son",
      state: "Uttar Pradesh",
      district: "Kanpur",
      pincode: "209203",
      address: "GT Road, Tatiyaganj, Kanpur",
    },
    {
      donorName: "Rajeshwari Devi",
      donorAge: 76,
      donorGender: "female",
      timeOfDeath: "Today, 08:50 AM",
      causeOfDeath: "Age-related complications",
      referrerName: "Manoj Kumar",
      referrerMobile: "+91 9935123456",
      referrerRelationship: "Son",
      state: "Uttar Pradesh",
      district: "Varanasi",
      pincode: "221003",
      address: "Ring Road Phase-I, Madhopur, Varanasi",
    },
    {
      donorName: "Gurpreet Singh",
      donorAge: 61,
      donorGender: "male",
      timeOfDeath: "Today, 07:40 AM",
      causeOfDeath: "Myocardial Infarction",
      referrerName: "Harpreet Singh",
      referrerMobile: "+91 9872134567",
      referrerRelationship: "Brother",
      state: "Punjab",
      district: "Ludhiana",
      pincode: "141102",
      address: "Ferozepur Road, Bhanohar, Ludhiana",
    },
    {
      donorName: "Ananth Narayan",
      donorAge: 65,
      donorGender: "male",
      timeOfDeath: "Today, 09:10 AM",
      causeOfDeath: "Cardiopulmonary Arrest",
      referrerName: "Deepa Narayan",
      referrerMobile: "+91 9845012345",
      referrerRelationship: "Daughter",
      state: "Karnataka",
      district: "Bengaluru",
      pincode: "560037",
      address: "Varthur Main Road, Kundalahalli, Bengaluru",
    },
    {
      donorName: "Sneha Kulkarni",
      donorAge: 55,
      donorGender: "female",
      timeOfDeath: "Today, 08:00 AM",
      causeOfDeath: "Brain Hemorrhage",
      referrerName: "Amit Kulkarni",
      referrerMobile: "+91 9820123456",
      referrerRelationship: "Husband",
      state: "Maharashtra",
      district: "Panvel",
      pincode: "410206",
      address: "Sector 5A, New Panvel East, Panvel",
    },
    {
      donorName: "Jagdish Prasad",
      donorAge: 70,
      donorGender: "male",
      timeOfDeath: "Today, 07:30 AM",
      causeOfDeath: "Cardiac Arrest",
      referrerName: "Vijay Prasad",
      referrerMobile: "+91 9414012345",
      referrerRelationship: "Son",
      state: "Rajasthan",
      district: "Jaipur",
      pincode: "302039",
      address: "Sector 6, Vidyadhar Nagar, Jaipur",
    },
    {
      donorName: "Shanthi Hegde",
      donorAge: 67,
      donorGender: "female",
      timeOfDeath: "Today, 08:20 AM",
      causeOfDeath: "Natural Demise",
      referrerName: "Raghavendra Hegde",
      referrerMobile: "+91 9480123456",
      referrerRelationship: "Son",
      state: "Karnataka",
      district: "Shivamogga",
      pincode: "577202",
      address: "Harakere, Thirthahalli Road, Shivamogga",
    }
  ];

  const units = await db.select().from(unitsTable);
  const defaultUnitId = units[0]?.id || 1;

  const inserted = [];
  for (const item of dummyCalls) {
    const matchedUnit = units.find(
      (u) =>
        u.district.toLowerCase() === item.district.toLowerCase() ||
        u.state.toLowerCase() === item.state.toLowerCase()
    ) || units[0];

    const unitId = matchedUnit?.id || defaultUnitId;
    const [call] = await db
      .insert(eyeCallsTable)
      .values({
        ...item,
        unitId,
        callId: generateCallId(),
        status: "new",
      })
      .returning();
    inserted.push(await attachUnitName(call));
  }

  const user = (req as any).appUser;
  await logActivity(req, {
    action: "GENERATE_DUMMY_CALLS",
    entityType: "system",
    description: `${user?.name || "Coordinator"} generated 10 test emergency calls`,
    details: { count: inserted.length },
  });

  res.status(201).json({ success: true, count: inserted.length, data: inserted });
});

export default router;
