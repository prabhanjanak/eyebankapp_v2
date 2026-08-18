import { db, auditLogsTable } from "@workspace/db";
import { logger } from "./logger";
import type { Request } from "express";

export interface LogActivityParams {
  action: string; // 'LOGIN' | 'LOGOUT' | 'CALL_CREATED' | 'STATUS_CHANGE' | 'DISPATCH_COORDINATOR' | 'CALL_COMPLETED' | 'GENERATE_DUMMY_CALLS' | 'DELETE_CALL' | 'USER_CREATED' | 'USER_UPDATED' | 'PASSWORD_CHANGED'
  entityType: string; // 'eye_call' | 'auth' | 'user' | 'unit' | 'system'
  entityId?: string | number | null;
  description: string;
  details?: Record<string, any> | string | null;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  clientApp?: string | null;
}

export async function logActivity(req: Request | null, params: LogActivityParams): Promise<void> {
  try {
    let appUser = req ? (req as any).appUser : null;
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    let clientApp = params.clientApp;

    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      ipAddress = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || null;
      userAgent = (req.headers["user-agent"] as string) || null;

      const headerClient = req.headers["x-client-app"] as string | undefined;
      if (headerClient) {
        clientApp = headerClient;
      } else if (userAgent && (userAgent.includes("Dart") || userAgent.includes("Flutter") || userAgent.includes("sankara_coordinator"))) {
        clientApp = "mobile_app";
      } else {
        clientApp = clientApp || "web";
      }
    }

    const userId = params.userId ?? appUser?.id ?? null;
    const userName = params.userName ?? appUser?.name ?? "System";
    const userEmail = params.userEmail ?? appUser?.email ?? null;
    const userRole = params.userRole ?? appUser?.role ?? null;

    let detailsString: string | null = null;
    if (params.details) {
      if (typeof params.details === "string") {
        detailsString = params.details;
      } else {
        detailsString = JSON.stringify(params.details);
      }
    }

    await db.insert(auditLogsTable).values({
      userId,
      userName,
      userEmail,
      userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ? String(params.entityId) : null,
      description: params.description,
      details: detailsString,
      clientApp: clientApp || "web",
      ipAddress,
    });

    logger.info(
      { action: params.action, entityId: params.entityId, userName, clientApp },
      `[AUDIT] ${params.description}`
    );
  } catch (err) {
    logger.error({ err, params }, "Failed to record audit log");
  }
}
