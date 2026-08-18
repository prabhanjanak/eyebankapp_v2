import { db, pledgesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendPledgeCertificate } from "./services/notifications";

async function main() {
  const id = 1;
  try {
    console.log("Fetching pledge 1...");
    const [pledge] = await db.select().from(pledgesTable).where(eq(pledgesTable.id, id));
    if (!pledge) {
      console.error("Pledge 1 not found in database!");
      process.exit(1);
    }
    
    console.log("Calling sendPledgeCertificate...");
    await sendPledgeCertificate(pledge);
    
    console.log("Updating database status...");
    const [updated] = await db
      .update(pledgesTable)
      .set({ isCertificateSent: true })
      .where(eq(pledgesTable.id, id))
      .returning();

    console.log("Success! Updated pledge:", JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error("DEBUG ROUTE FAILED WITH ERROR:", error);
  }
  process.exit(0);
}

main();
