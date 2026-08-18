import PDFDocument from "pdfkit";

export function generatePledgePdf(pledge: { id: number; fullName: string; pledgedAt: Date | string; bloodGroup?: string | null }) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Design layout
      // Outer border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(3)
         .stroke("#ea580c"); // Orange

      // Inner thin border
      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
         .lineWidth(1)
         .stroke("#f97316");

      // Title
      doc.fillColor("#ea580c")
         .font("Helvetica-Bold")
         .fontSize(32)
         .text("SANKARA EYE BANK", 0, 80, { align: "center" });

      doc.fillColor("#475569")
         .font("Helvetica")
         .fontSize(16)
         .text("Certificate of Appreciation", 0, 130, { align: "center" });

      doc.fillColor("#64748b")
         .font("Helvetica-Oblique")
         .fontSize(14)
         .text("This certificate is proudly presented to", 0, 180, { align: "center" });

      // Name
      doc.fillColor("#0f172a")
         .font("Helvetica-Bold")
         .fontSize(28)
         .text(pledge.fullName, 0, 220, { align: "center" });

      // Text description
      doc.fillColor("#334155")
         .font("Helvetica")
         .fontSize(14)
         .text(
           "For the noble pledge to donate their eyes posthumously\nand gift the vision of sight to those in need.",
           40,
           280,
           { align: "center", width: doc.page.width - 80, lineGap: 6 }
         );

      // Pledge Details Box
      doc.rect(100, 340, doc.page.width - 200, 80)
         .fillOpacity(0.05)
         .fill("#ffedd5")
         .strokeOpacity(1)
         .lineWidth(1)
         .stroke("#fed7aa");

      doc.fillOpacity(1)
         .fillColor("#475569")
         .font("Helvetica-Bold")
         .fontSize(11);

      const padId = `PLEDGE-${pledge.id.toString().padStart(5, '0')}`;
      const dateStr = new Date(pledge.pledgedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      doc.text(`Pledge ID: ${padId}`, 130, 360);
      doc.text(`Date Registered: ${dateStr}`, 130, 380);
      doc.text(`Blood Group: ${pledge.bloodGroup || "N/A"}`, 130, 400);

      // Quote
      doc.fillColor("#ea580c")
         .font("Helvetica-Bold")
         .fontSize(16)
         .text('"Do not bury, do not burn, donate eyes."', 0, 450, { align: "center" });

      doc.fillColor("#94a3b8")
         .font("Helvetica")
         .fontSize(10)
         .text("Sankara Eye Bank • Sri Kanchi Kamakoti Medical Trust", 0, 490, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
