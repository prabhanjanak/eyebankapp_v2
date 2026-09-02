import type { Request, Response } from "express";
import app from "../artifacts/api-server/src/app";
import { ensureSuperAdmin, ensureHospitalUnits } from "../artifacts/api-server/src/index";

let isInit = false;

async function initServerless() {
  if (!isInit) {
    isInit = true;
    try {
      await ensureSuperAdmin();
      await ensureHospitalUnits();
    } catch (err) {
      console.error("Vercel serverless init error:", err);
    }
  }
}

export default async function handler(req: Request, res: Response) {
  await initServerless();
  return app(req, res);
}
