import * as apiModule from "../artifacts/api-server/dist/index.mjs";

const app = apiModule.default || apiModule.app;
const ensureSuperAdmin = apiModule.ensureSuperAdmin;
const ensureHospitalUnits = apiModule.ensureHospitalUnits;

let isInit = false;

async function initServerless() {
  if (!isInit) {
    isInit = true;
    try {
      if (typeof ensureSuperAdmin === "function") await ensureSuperAdmin();
      if (typeof ensureHospitalUnits === "function") await ensureHospitalUnits();
    } catch (err) {
      console.error("Vercel serverless init error:", err);
    }
  }
}

export default async function handler(req, res) {
  await initServerless();
  return app(req, res);
}
