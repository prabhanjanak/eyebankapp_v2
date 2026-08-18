import { Router } from "express";
import nodemailer from "nodemailer";
import { requireAuth } from "../middlewares/requireAuth";
import fs from "fs";
import path from "path";

const router = Router();

function getSettingsFilePath(): string {
  if (process.env.SETTINGS_FILE_PATH) return path.resolve(process.env.SETTINGS_FILE_PATH);
  const inData = path.resolve(process.cwd(), "data/settings.json");
  if (fs.existsSync(inData)) return inData;
  const inCwd = path.resolve(process.cwd(), "settings.json");
  if (fs.existsSync(inCwd)) return inCwd;
  return inData;
}

// GET /api/settings
router.get("/settings", requireAuth, async (req, res): Promise<void> => {
  try {
    const settingsPath = getSettingsFilePath();
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      res.json(data);
    } else {
      res.json({
        smtpHost: process.env.SMTP_HOST || "",
        smtpPort: process.env.SMTP_PORT || "587",
        username: process.env.SMTP_USER || "",
        password: process.env.SMTP_PASS || "",
        fromName: "Sankara Eye Bank Alerts"
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

// POST /api/settings
router.post("/settings", requireAuth, async (req, res): Promise<void> => {
  try {
    const settingsPath = getSettingsFilePath();
    const parentDir = path.dirname(settingsPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    let existingSettings: Record<string, any> = {};
    if (fs.existsSync(settingsPath)) {
      try {
        existingSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      } catch (e) {
        existingSettings = {};
      }
    }
    const updatedSettings = { ...existingSettings, ...req.body };
    fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), "utf-8");
    res.json({ success: true, message: "Settings saved successfully", data: updatedSettings });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// POST /api/settings/test-email
router.post("/settings/test-email", requireAuth, async (req, res): Promise<void> => {
  const { smtpHost, smtpPort, username, password, fromName, testEmail } = req.body;

  if (!smtpHost || !smtpPort || !username || !password || !testEmail) {
    res.status(400).json({ error: "Missing required SMTP parameters or recipient email" });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort) || 587,
    secure: Number(smtpPort) === 465,
    auth: {
      user: username,
      pass: password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  try {
    // Perform verification of the SMTP handshake
    await transporter.verify();

    // Send the test email
    await transporter.sendMail({
      from: `"${fromName || 'Sankara Eye Bank'}" <${username}>`,
      to: testEmail,
      subject: "Sankara Eye Hospital - SMTP Connection Test",
      text: "Congratulations! Your SMTP connection and authentication parameters are configured correctly.",
      html: `
        <div style="font-family: sans-serif; padding: 25px; border: 2px solid #ff7a18; border-radius: 12px; max-width: 500px; margin: 0 auto; background: #fffaf5;">
          <h2 style="color: #ff7a18; margin-top: 0;">🟢 SMTP Handshake Success</h2>
          <p style="color: #334155; line-height: 1.6;">This is an automated test email sent from your Sankara Eye Bank settings panel.</p>
          <p style="color: #475569; font-weight: bold;">Your SMTP mail server configuration is fully functional and ready to dispatch certificates!</p>
          <hr style="border: 0; border-top: 1px solid #fed7aa; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Sankara Eye Bank • Sri Kanchi Kamakoti Medical Trust</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Handshake verified and email sent successfully" });
  } catch (error: any) {
    console.error("[SMTP Test Error]", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to establish secure SMTP connection" 
    });
  }
});

export default router;
