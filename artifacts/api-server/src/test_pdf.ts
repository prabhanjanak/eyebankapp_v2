import { generatePledgePdf } from "./services/pdfGenerator";

async function main() {
  try {
    const mockPledge = {
      id: 1,
      fullName: "Test Pledger",
      pledgedAt: new Date(),
      bloodGroup: "O+",
    };
    console.log("Generating PDF...");
    const pdfBuffer = await generatePledgePdf(mockPledge);
    console.log("PDF generated successfully! Size:", pdfBuffer.length);
  } catch (error) {
    console.error("PDF generation failed:", error);
  }
}

main();
