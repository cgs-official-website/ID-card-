import { jsPDF } from "jspdf";
import logoImg from "../assets/invoice_logo.png";
import signatureImg from "../assets/invoice_signature.png";

const toBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const C = {
  primary:   "#4f46e5",
  accent:    "#9333ea",
  success:   "#10b981",
  dark:      "#0f172a",
  muted:     "#64748b",
  lightBg:   "#f8fafc",
  border:    "#e2e8f0",
  white:     "#ffffff",
  footerBg:  "#1e293b",
  headerTxt: "#c8d2ff",
  subTxt:    "#b4bef0",
};

const fill   = (doc, hex) => { doc.setFillColor(hex);   };
const stroke = (doc, hex) => { doc.setDrawColor(hex);   };
const txt    = (doc, hex) => { doc.setTextColor(hex);   };

export const generateOfferLetterPDF = async (candidate) => {
  const doc  = new jsPDF({ unit: "mm", format: "a4" });
  const W    = doc.internal.pageSize.getWidth();
  const H    = doc.internal.pageSize.getHeight();

  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const offerNumber = candidate.offerNumber || `CGS-OFF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  // HEADER
  fill(doc, C.primary);
  doc.rect(0, 0, W, 48, "F");
  
  fill(doc, C.accent);
  doc.triangle(W - 55, 0, W, 0, W, 48, "F");

  fill(doc, C.success);
  doc.rect(0, 48, W, 2.5, "F");

  const logoB64 = await toBase64(logoImg);
  if (logoB64) {
    doc.addImage(logoB64, "PNG", 10, 5, 36, 36);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    txt(doc, C.white);
    doc.text("CGS", 16, 30);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  txt(doc, C.white);
  doc.text("CAREZZA GLOBAL SOLUTIONS", 52, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  txt(doc, C.headerTxt);
  doc.text("Advanced IT & Internship Training Provider", 52, 28);

  doc.setFontSize(8);
  txt(doc, C.subTxt);
  doc.text("www.teamcarrezza.com  |  info@teamcarrezza.com | +91-91508 86338", 52, 36);

  // TITLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  txt(doc, C.primary);
  doc.text("INTERNSHIP OFFER LETTER", W/2, 65, { align: "center" });

  // REF NO AND DATE
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  txt(doc, C.dark);
  doc.text(`Ref: ${offerNumber}`, 15, 75);
  doc.text(`Date: ${date}`, W - 15, 75, { align: "right" });

  // SALUTATION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Dear ${candidate.name || "[Candidate Name]"},`, 15, 90);

  // BODY
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const textOptions = { maxWidth: W - 30, lineHeightFactor: 1.5 };
  let startY = 100;
  
  const role = candidate.role || "Intern";
  const startDate = candidate.startDate || "[Start Date]";
  const duration = candidate.duration || "[Duration]";
  const stipend = candidate.stipend || "Unpaid";
  
  const p1 = `We are pleased to offer you an internship opportunity at Carezza Global Solutions in the position of ${role}. Your internship will commence on ${startDate} and will be for a duration of ${duration}.`;
  
  const lines1 = doc.splitTextToSize(p1, W - 30);
  doc.text(lines1, 15, startY, textOptions);
  startY += (lines1.length * 5) + 5;

  const p2 = `During your internship, you will be expected to learn, contribute, and engage in various real-world projects. You may be required to undergo specific training as deemed necessary by your mentors.`;
  const lines2 = doc.splitTextToSize(p2, W - 30);
  doc.text(lines2, 15, startY, textOptions);
  startY += (lines2.length * 5) + 5;

  if (stipend && stipend.toLowerCase() !== "unpaid" && stipend.trim() !== "") {
    const p3 = `As discussed, you will receive a stipend of ${stipend} during your internship period.`;
    const lines3 = doc.splitTextToSize(p3, W - 30);
    doc.text(lines3, 15, startY, textOptions);
    startY += (lines3.length * 5) + 5;
  }

  const p4 = `Please note that this offer is contingent upon your agreement to our confidentiality and non-disclosure terms, and your compliance with the policies and procedures of Carezza Global Solutions.`;
  const lines4 = doc.splitTextToSize(p4, W - 30);
  doc.text(lines4, 15, startY, textOptions);
  startY += (lines4.length * 5) + 15;

  doc.text(`Congratulations and we look forward to working with you!`, 15, startY);
  startY += 15;

  // SIGNATURE
  doc.setFont("helvetica", "normal");
  doc.text("Sincerely,", 15, startY);
  startY += 10;
  
  const sigB64 = await toBase64(signatureImg);
  if (sigB64) {
    doc.addImage(sigB64, "PNG", 15, startY, 40, 13);
  }
  startY += 18;

  doc.setFont("helvetica", "bold");
  doc.text("Founder & CEO", 15, startY);
  doc.setFont("helvetica", "normal");
  doc.text("Carezza Global Solutions", 15, startY + 5);

  // FOOTER
  fill(doc, C.footerBg);
  doc.rect(0, H - 16, W, 16, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  txt(doc, "#96a0c8");
  doc.text(
    "This is a computer-generated document and does not require a physical signature.",
    W / 2, H - 9,
    { align: "center" }
  );
  txt(doc, C.primary);
  doc.text("www.teamcarrezza.com", W / 2, H - 4, { align: "center" });

  const fileName = candidate.name ? `Offer_Letter_${candidate.name.replace(/ /g, "_")}.pdf` : "Offer_Letter.pdf";
  doc.save(fileName);
};
