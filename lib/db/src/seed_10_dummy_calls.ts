import { db } from "./index.js";
import { eyeCallsTable } from "./schema/eyeCalls.js";
import { unitsTable } from "./schema/units.js";

function generateCallId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EC${year}${month}${day}${rand}`;
}

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
  },
];

async function seedDummyCalls() {
  console.log("🚨 Seeding 10 live dummy emergency calls into Neon database...");

  const units = await db.select().from(unitsTable);
  const defaultUnitId = units[0]?.id || 1;

  for (let i = 0; i < dummyCalls.length; i++) {
    const item = dummyCalls[i];
    const matchedUnit = units.find(
      (u) =>
        u.district.toLowerCase() === item.district.toLowerCase() ||
        u.state.toLowerCase() === item.state.toLowerCase()
    ) || units[0];

    const unitId = matchedUnit?.id || defaultUnitId;
    const callId = generateCallId();

    const [call] = await db
      .insert(eyeCallsTable)
      .values({
        ...item,
        unitId,
        callId,
        status: "new",
      })
      .returning();

    console.log(`✅ [${i + 1}/10] Emergency Call Created: ${call.callId} | Donor: ${call.donorName} (${call.state})`);
  }

  console.log("\n🎉 Successfully dispatched 10 dummy emergency calls into the system!");
  process.exit(0);
}

seedDummyCalls().catch((err) => {
  console.error("Error seeding dummy calls:", err);
  process.exit(1);
});
