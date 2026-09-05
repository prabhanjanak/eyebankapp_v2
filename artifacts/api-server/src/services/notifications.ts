import nodemailer from "nodemailer";
import { generatePledgePdf } from "./pdfGenerator";
import path from "path";
import fs from "fs";

function getSettingsFilePath(): string {
  if (process.env.SETTINGS_FILE_PATH) return process.env.SETTINGS_FILE_PATH;
  const inCwd = path.resolve(process.cwd(), "settings.json");
  if (fs.existsSync(inCwd)) return inCwd;
  const inApiServer = path.resolve(__dirname, "../../settings.json");
  if (fs.existsSync(inApiServer)) return inApiServer;
  return inCwd;
}

function getLogoPath(): string | undefined {
  const possiblePaths = [
    path.resolve(process.cwd(), "../sankara-eye/public/logo.png"),
    path.resolve(process.cwd(), "artifacts/sankara-eye/public/logo.png"),
    path.resolve(__dirname, "../../../sankara-eye/public/logo.png"),
    path.resolve(__dirname, "../../public/logo.png"),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

// WhatsApp API integration via Meta Cloud API using stored parameters
export async function sendWhatsAppNotification(
  phoneNumber: string, 
  message: string, 
  attachment?: { filename: string; content: Buffer; contentType: string }
) {
  // Try to load token configuration values from settings.json or env variables
  const settingsPath = getSettingsFilePath();
  let phoneId = "475216735670574";
  let token = "EAAZAHgyNtIKcBRZBWtHPngkk4Vvt2pKrZAbzGEqMaJfqKYy5wkSF44Owstkkqn0sQUCZBeWVG4tBbFC8VIyS3qDZAyXPzsB8AFmQeV3fP60rN2ynY1fTX0OG5ZAvJKny8fZAZACYMtLa7u4gML1JMsRn871nHmYcrtJK04BYSVLWgoqBZCzQosb2KZBR56Pe69jZAZCwewZDZD";

  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      if (data.whatsappPhoneId) phoneId = data.whatsappPhoneId;
      if (data.whatsappToken) token = data.whatsappToken;
    }
  } catch (err) {
    console.error("Error loading server WhatsApp settings:", err);
  }

  const targetPhone = phoneNumber.replace(/[^0-9]/g, "");
  
  // Clean phone number formatting to guarantee country code is prepended
  const formattedPhone = targetPhone.startsWith("91") && targetPhone.length === 12 
    ? targetPhone 
    : `91${targetPhone.slice(-10)}`;

  console.log(`[WhatsApp Backend Sending] To: ${formattedPhone} using Phone ID: ${phoneId}`);

  try {
    // If it is a pledge certificate notification message, parse and match variables to send as the approved template!
    let payload: any;
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("pledge") || lowerMessage.includes("appreciate") || lowerMessage.includes("certificate")) {
      // Extract secure token from message link
      const tokenMatch = message.match(/\/pledges\/c\/([a-zA-Z0-9]+)/);
      const secureToken = tokenMatch ? tokenMatch[1] : "a3fbc91e77d85ea0";
      
      // Parse name from message "Dear [Name],"
      const nameMatch = message.match(/Dear\s+([^,\n]+)/);
      const pledgerName = nameMatch ? nameMatch[1].trim() : "Pledger";

      const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
      const secureLink = `${baseUrl}/api/public/pledges/c/${secureToken}`;

      payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "living_eye_pledge_certificate",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: pledgerName },
                { type: "text", text: secureLink }
              ]
            }
          ]
        }
      };
    } else {
      // Fallback to sending hello_world test template if not matching custom formats
      payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" }
        }
      };
    }

    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json();
    if (!response.ok) {
      console.error("[WhatsApp Backend API Error]:", resData);
    } else {
      console.log("[WhatsApp Backend API Success]: Message queued!", resData);
    }
  } catch (err) {
    console.error("[WhatsApp Backend API Exception]:", err);
  }
}

// Helper to load SMTP configurations
function getSmtpSettings() {
  const settingsPath = getSettingsFilePath();
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading SMTP settings file:", err);
  }
  return null;
}

// SMTP Email Integration
export async function sendEmailNotification(
  to: string, 
  subject: string, 
  html: string,
  attachments?: Array<{ filename: string; path?: string; content?: Buffer | string; contentType?: string; cid?: string }>
) {
  if (!to || !to.trim() || to.toLowerCase().includes("eyebank@sankaraeye.com")) {
    console.log(`[SMTP Suppressed] Email delivery disabled for address: ${to}`);
    return;
  }

  const settings = getSmtpSettings();
  const host = settings?.smtpHost || process.env.SMTP_HOST;
  const port = Number(settings?.smtpPort || process.env.SMTP_PORT) || 587;
  const secure = settings?.smtpPort ? Number(settings.smtpPort) === 465 : process.env.SMTP_SECURE === 'true';
  const user = settings?.username || process.env.SMTP_USER;
  const pass = settings?.password || process.env.SMTP_PASS;
  const fromName = settings?.fromName || "Sankara Eye Hospital";

  if (!host || !user || !pass) {
    console.log(`[SMTP Stub] To: ${to} | Subject: ${subject}`);
    if (attachments && attachments.length > 0) {
      console.log(`[SMTP Stub] Attached: ${attachments.map(a => a.filename).join(", ")}`);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`[SMTP Success] Sent to ${to}`);
  } catch (error) {
    console.error(`[SMTP Error] Failed to send email:`, error);
  }
}

export async function broadcastOutofRegionAlert(data: any) {
  const message = `URGENT: Out-of-region Eye Donation Request (${data.state}). 
Donor: ${data.donorName}, Age: ${data.donorAge}. 
Call ID: ${data.callId}.
Please check the dashboard to claim and route this to a local partner hospital.`;

  const html = `
    <h2>Urgent: Out-of-region Eye Donation</h2>
    <p>A new eye donation request has been logged outside our standard operating regions.</p>
    <ul>
      <li><strong>State:</strong> ${data.state}</li>
      <li><strong>District:</strong> ${data.district}</li>
      <li><strong>Donor:</strong> ${data.donorName} (${data.donorAge})</li>
      <li><strong>Time of Death:</strong> ${data.timeOfDeath}</li>
    </ul>
    <p>Please log into the dashboard immediately to claim this call and dispatch to a local partner hospital.</p>
  `;

  // For now, this broadcasts to a central group or all active admins.
  // We can fetch all users from the DB who are coordinators and loop, 
  // but for the stub we will just log the broadcast.
  console.log("BROADCASTING OUT OF REGION ALERT...");
  
  // Example: notify central HQ or all users
  await sendEmailNotification("hq@sankaraeye.com", "URGENT: Out-of-Region Donation Request", html);
  await sendWhatsAppNotification("+919000019190", message);
}

export async function notifyAssignedUnit(data: any, unit: any) {
  const message = `NEW EYE DONATION CALL (${data.callId})
Assigned to: ${unit.name}

Donor: ${data.donorName} (Age: ${data.donorAge})
Location: ${data.address}, ${data.district}, ${data.state}
Time of Death: ${data.timeOfDeath}

Referrer: ${data.referrerName} (${data.referrerMobile})

Please take immediate action and coordinate with the team.`;

  const html = `
    <h2>New Eye Donation Call Assigned</h2>
    <p><strong>Call ID:</strong> ${data.callId}</p>
    <p><strong>Assigned Unit:</strong> ${unit.name}</p>
    <hr/>
    <h3>Donor Details</h3>
    <ul>
      <li><strong>Name:</strong> ${data.donorName}</li>
      <li><strong>Age:</strong> ${data.donorAge}</li>
      <li><strong>Time of Death:</strong> ${data.timeOfDeath}</li>
      <li><strong>Cause:</strong> ${data.causeOfDeath}</li>
    </ul>
    <h3>Location</h3>
    <p>${data.address}, ${data.district}, ${data.state}</p>
    <h3>Referrer</h3>
    <p>${data.referrerName} (${data.referrerMobile})</p>
    <br/>
    <p>Please log into your dashboard to process this request immediately.</p>
  `;

  console.log(`NOTIFYING ASSIGNED UNIT: ${unit.name}`);
  await sendEmailNotification(unit.coordinatorEmail, `New Eye Donation Call Assigned: ${data.callId}`, html);
  await sendWhatsAppNotification(unit.coordinatorWhatsapp, message);
}

export async function sendSmsNotification(phoneNumber: string, message: string) {
  // SMS Stub (e.g. Fast2SMS or Twilio)
  if (!process.env.SMS_API_KEY) {
    console.log(`[SMS Stub] To: ${phoneNumber} | Message: ${message}`);
    return;
  }
  
  // Example for Fast2SMS (Indian cheap provider)
  try {
    console.log(`[SMS Sending] To: ${phoneNumber}`);
    // await axios.post("https://www.fast2sms.com/dev/bulkV2", {
    //   route: "q",
    //   message: message,
    //   language: "english",
    //   flash: 0,
    //   numbers: phoneNumber.replace("+91", ""),
    // }, {
    //   headers: { "authorization": process.env.SMS_API_KEY }
    // });
    console.log(`[SMS Success] Sent to ${phoneNumber}`);
  } catch (error) {
    console.error(`[SMS Error] Failed to send SMS:`, error);
  }
}

export async function notifyReferrerOfThirdPartyAssignment(data: any) {
  const message = `Sankara Eye Bank Update:
The eye donation for ${data.donorName} has been assigned to our partner:
Hospital: ${data.thirdPartyHospitalDetails}
Contact/Helper: ${data.thirdPartyHelperContact}

They will reach the location shortly. Thank you for your noble gesture.`;

  const html = `
    <h2>Eye Donation Assignment Update</h2>
    <p>Dear ${data.referrerName},</p>
    <p>The eye donation request for <strong>${data.donorName}</strong> has been successfully assigned to our trusted regional partner hospital to ensure the fastest possible retrieval within the 6-hour window.</p>
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffe69c; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #664d03;">Assigned Partner Details</h3>
      <p><strong>Hospital/NGO Name:</strong> ${data.thirdPartyHospitalDetails}</p>
      <p><strong>Helper/Coordinator Contact:</strong> ${data.thirdPartyHelperContact}</p>
    </div>
    <p>They have been provided with your location and will contact you shortly.</p>
    <p>We deeply respect your family's noble gesture.</p>
    <br/>
    <p><em>Sankara Eye Bank</em></p>
  `;

  console.log(`NOTIFYING REFERRER OF THIRD PARTY ASSIGNMENT: ${data.referrerMobile}`);
  
  // Send SMS
  await sendSmsNotification(data.referrerMobile, message);
  // Send WhatsApp
  await sendWhatsAppNotification(data.referrerMobile, message);
  // Send Email if we had their email. Currently we only have mobile, but if we add email in future we can call sendEmailNotification
}

export async function notifyReferrerOfEmergencyCall(data: any, unit: any) {
  const message = `Dear ${data.referrerName},

Thank you for contacting Sankara Eye Bank. We have registered your request (Call ID: ${data.callId}) for the eye donation of the late ${data.donorName}.

Our medical retrieval team from ${unit.name} has been notified and will coordinate with you shortly.

INSTRUCTIONS WHILE YOU WAIT:
1. Close the eyes of the deceased and place wet cotton wool over the eyelids (to keep the cornea moist & healthy).
2. Switch off any ceiling fans in the room (to prevent the eyes from drying).
3. Raise the head of the deceased slightly by placing a pillow.
4. Keep the death certificate or medical doctor's note handy.

We appreciate your noble gesture in giving the gift of sight to others.

With respect,
Sankara Eye Bank`;

  console.log(`NOTIFYING REFERRER OF NEW EMERGENCY EYE CALL: ${data.referrerMobile}`);
  await sendSmsNotification(data.referrerMobile, message);
  await sendWhatsAppNotification(data.referrerMobile, message);
}

export async function sendPledgeCertificate(data: any) {
  const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
  const secureLink = `${baseUrl}/api/public/pledges/c/${data.secureToken}`;
  
  const message = `Dear ${data.fullName},

Thank you for pledging to donate your eyes with Sankara Eye Bank!
"Do not bury, do not burn, donate eyes."

Your official Certificate of Appreciation has been generated. You can view, download, or print your certificate directly from this secure link:
${secureLink}

With gratitude,
Sankara Eye Hospital`;

  const html = `
    <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); background: #ffffff;">
      <!-- Header with Logo -->
      <div style="background: #fffaf5; padding: 25px 30px; border-bottom: 2px solid #ff7a18; text-align: center;">
        <img src="cid:hospital_logo" alt="Sankara Eye Hospital Logo" style="max-height: 65px; width: auto;" />
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #0f172a;">Dear ${data.fullName},</p>
        
        <p style="font-size: 15px; margin-bottom: 20px;">Thank you for pledging to donate your eyes and helping bring the gift of sight to others.</p>
        <p style="font-size: 15px; margin-bottom: 20px;">You can now download your eye donation certificate in the attachment.</p>
        <p style="font-size: 15px; font-style: italic; color: #ea580c; font-weight: bold; margin-bottom: 30px;">"Your support means the world."</p>

        <!-- Guidelines Box -->
        <div style="background: #fdfaf7; border: 1px dashed #fed7aa; border-radius: 8px; padding: 20px 25px; margin-bottom: 30px;">
          <h3 style="color: #ea580c; margin-top: 0; font-size: 16px; border-bottom: 1px solid #ffedd5; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Eye Donation is Simple</h3>
          <h4 style="color: #7c2d12; font-size: 12px; margin: 10px 0; text-transform: uppercase; font-weight: bold;">JUST REMEMBER THESE GUIDELINES:</h4>
          <ul style="padding-left: 20px; margin: 0; font-size: 13px; color: #475569; line-height: 1.8;">
            <li>Age, sex, race or religion is no bar. Keep informed close relatives about your desire to donate.</li>
            <li>Wearing glasses, cataract, certain eye problems or blood group does not affect eye donation.</li>
            <li>On death, inform eye bank immediately to do eye donation.</li>
            <li>The eye donation must be within 6 hours of death.</li>
            <li>Close eyes and place wet cotton over lids (to keep cornea moist & healthy).</li>
            <li>Switch off fans.</li>
            <li>Removal takes only about 20 minutes.</li>
            <li>No special room necessary.</li>
            <li>No disfiguration is caused.</li>
            <li>Donated eyes are never sold/used otherwise.</li>
            <li>Two persons gain sight. 2.5 million Indians need sight. Do not deny them life. Spread the message of eye donation.</li>
          </ul>
        </div>

        <p style="margin-top: 30px; margin-bottom: 5px; font-size: 14px;">With gratitude,</p>
        <p style="font-weight: bold; color: #0f172a; margin-top: 0; font-size: 15px;">Sankara Eye Hospital</p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 15px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
        Sankara Eye Bank • Sri Kanchi Kamakoti Medical Trust
      </div>
    </div>
  `;

  console.log(`SENDING PLEDGE CERTIFICATE TO: ${data.email} / ${data.mobile}`);

  try {
    // 1. Generate the PDF buffer
    const pdfBuffer = await generatePledgePdf(data);
    const filename = `Sankara_Eye_Pledge_${data.id.toString().padStart(5, '0')}.pdf`;
    
    // Resolve absolute path to the hospital logo
    const logoPath = getLogoPath();
    const attachments: Array<{ filename: string; path?: string; content?: Buffer; contentType?: string; cid?: string }> = [
      { 
        filename, 
        content: pdfBuffer, 
        contentType: "application/pdf" 
      }
    ];

    if (logoPath) {
      attachments.unshift({
        filename: "logo.png",
        path: logoPath,
        cid: "hospital_logo"
      });
    }

    // 2. We send the HTML email with logo CID attachment and certificate PDF attached
    await sendEmailNotification(
      data.email, 
      "Your Eye Donation Pledge Certificate - Sankara Eye Hospital", 
      html,
      attachments
    );
    
    // 3. Send WhatsApp with the secure link
    await sendWhatsAppNotification(data.mobile, message);
  } catch (error) {
    console.error("Error generating or sending pledge certificate:", error);
    throw error;
  }
}

export async function notifyReferrerOfTeamDispatch(data: any, unit: any) {
  const message = `Sankara Eye Bank Dispatch Alert:
Our medical retrieval team has been dispatched from ${unit.name} for the late ${data.donorName}.
Call ID: ${data.callId}

The team is in transit. Please coordinate with them on this contact if needed. Thank you for your noble gesture.`;

  console.log(`NOTIFYING REFERRER OF TEAM DISPATCH: ${data.referrerMobile}`);
  await sendSmsNotification(data.referrerMobile, message);
  await sendWhatsAppNotification(data.referrerMobile, message);
}

export async function notifyReferrerOfStatusUpdate(data: any, unit: any) {
  const message = `Sankara Eye Bank Update:
The request (Call ID: ${data.callId}) for the late ${data.donorName} has been updated.
Current Status: ${data.status.replace("_", " ").toUpperCase()}

Thank you for your cooperation during this noble procedure.`;

  console.log(`NOTIFYING REFERRER OF STATUS UPDATE: ${data.referrerMobile}`);
  await sendSmsNotification(data.referrerMobile, message);
  await sendWhatsAppNotification(data.referrerMobile, message);
}

