import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/invoice_logo.png";
import signatureImg from "../assets/invoice_signature.png";

// Helper: convert an imported image URL to base64 via canvas
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
    img.onerror = () => resolve(null); // fallback gracefully
    img.src = url;
  });

// ── All colours as plain hex strings ──────────────────────────────────────
const C = {
  primary:   "#4f46e5",
  accent:    "#9333ea",
  success:   "#10b981",
  dark:      "#0f172a",
  muted:     "#64748b",
  lightBg:   "#f8fafc",
  border:    "#e2e8f0",
  white:     "#ffffff",
  footerBg:  "#1e293b",   // slightly lighter dark for footer
  headerTxt: "#c8d2ff",
  subTxt:    "#b4bef0",
};

// jsPDF helper wrappers (hex-safe) ─────────────────────────────────────────
const fill   = (doc, hex) => { doc.setFillColor(hex);   };
const stroke = (doc, hex) => { doc.setDrawColor(hex);   };
const txt    = (doc, hex) => { doc.setTextColor(hex);   };

export const generateInvoicePDF = async (candidate) => {
  const doc  = new jsPDF({ unit: "mm", format: "a4" });
  const W    = doc.internal.pageSize.getWidth();
  const H    = doc.internal.pageSize.getHeight();

  const date          = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const invoiceNumber = candidate.invoiceNumber || `CGS-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  // ─── HEADER BAND ─────────────────────────────────────────────────────────
  fill(doc, C.primary);
  doc.rect(0, 0, W, 48, "F");

  // Decorative corner triangle
  fill(doc, C.accent);
  doc.triangle(W - 55, 0, W, 0, W, 48, "F");

  // Accent bottom stripe
  fill(doc, C.success);
  doc.rect(0, 48, W, 2.5, "F");

  // Logo
  const logoB64 = await toBase64(logoImg);
  if (logoB64) {
    doc.addImage(logoB64, "PNG", 10, 5, 36, 36);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    txt(doc, C.white);
    doc.text("CGS", 16, 30);
  }

  // Company Name
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
  doc.text("GST No: 33AAFCG1234G1ZY", 52, 35);
  doc.text("www.teamcarrezza.com  |  info@teamcarrezza.com | +91-91508 86338", 52, 42);

  // ─── INVOICE META STRIP ───────────────────────────────────────────────────
  fill(doc, C.lightBg);
  doc.rect(0, 52, W, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  txt(doc, C.primary);
  doc.text("INVOICE", 12, 64);

  // Invoice No (left)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  txt(doc, C.muted);
  doc.text("Invoice No:", 12, 70);
  doc.setFont("helvetica", "bold");
  txt(doc, C.dark);
  doc.text(invoiceNumber, 38, 70);

  // Date (right)
  doc.setFont("helvetica", "normal");
  txt(doc, C.muted);
  doc.text("Date:", W - 65, 64);
  doc.setFont("helvetica", "bold");
  txt(doc, C.dark);
  doc.text(date, W - 55, 64);

  // Status badge
  doc.setFont("helvetica", "normal");
  txt(doc, C.muted);
  doc.text("Status:", W - 65, 70);

  fill(doc, C.success);
  doc.roundedRect(W - 52, 66, 22, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  txt(doc, C.white);
  doc.text("PAID", W - 44, 71);

  // ─── BILL TO + FROM CARDS ─────────────────────────────────────────────────
  const cardY = 80;

  // Bill To card
  fill(doc, C.white);
  stroke(doc, C.border);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, cardY, 90, 52, 3, 3, "FD");

  fill(doc, C.primary);
  doc.roundedRect(12, cardY, 90, 9, 3, 3, "F");
  doc.rect(12, cardY + 5, 90, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  txt(doc, C.white);
  doc.text("BILL TO", 17, cardY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  txt(doc, C.dark);
  doc.text(candidate.name || "Candidate Name", 17, cardY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  txt(doc, C.muted);
  const billRows = [
    candidate.college  || "College / Institute",
    candidate.location || "Location",
    candidate.year     ? `Year / Status: ${candidate.year}` : "",
  ].filter(Boolean);
  billRows.forEach((line, i) => doc.text(line, 17, cardY + 26 + i * 7));

  // Payment badge
  fill(doc, C.lightBg);
  doc.roundedRect(12, cardY + 43, 90, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  txt(doc, C.muted);
  doc.text("Payment Method:", 17, cardY + 49);
  txt(doc, C.primary);
  doc.text(candidate.payment === "CASH" ? "Hand Cash" : "UPI Payment", 57, cardY + 49);

  // From card
  fill(doc, C.white);
  stroke(doc, C.border);
  doc.roundedRect(W - 100, cardY, 88, 52, 3, 3, "FD");

  fill(doc, C.accent);
  doc.roundedRect(W - 100, cardY, 88, 9, 3, 3, "F");
  doc.rect(W - 100, cardY + 5, 88, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  txt(doc, C.white);
  doc.text("FROM", W - 94, cardY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  txt(doc, C.dark);
  doc.text("Carezza Global Solutions", W - 94, cardY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  txt(doc, C.muted);
  const fromRows = [
    "22/33, Carrezza Global Solutions, Opposite to URC Resrts,",
    "(ST)Kovai Main Road, Perundurai - 638052.",
    "GST: 33AAFCG1234G1ZY",
  ];
  fromRows.forEach((line, i) => doc.text(line, W - 94, cardY + 26 + i * 7));

  // ─── ITEMS TABLE ─────────────────────────────────────────────────────────
  const tableY = 140;

  // ── Dynamic price computation ────────────────────────────────────────────
  const BASE_AMOUNT = (candidate.baseAmount !== undefined && candidate.baseAmount !== null) ? Number(candidate.baseAmount) : 3500;
  const GST_RATE    = (candidate.gstRate !== undefined && candidate.gstRate !== null) ? Number(candidate.gstRate) : 0.18;
  const gstAmount   = Math.round(BASE_AMOUNT * GST_RATE);
  const totalAmount = BASE_AMOUNT + gstAmount;
  const duration    = candidate.duration || "1 Month";
  const courseName  = candidate.course   || "General Internship";
  const gstPct      = Math.round(GST_RATE * 100);
  const gstLabel    = `GST ${gstPct}%`;
  const fmt = (n) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  autoTable(doc, {
    startY: tableY,
    margin: { left: 12, right: 12 },
    head: [["#", "Description", "Duration", "Taxable Amt", gstLabel, "Total"]],
    body: [
      [
        "01",
        `Internship Training Program\n${courseName}`,
        duration,
        fmt(BASE_AMOUNT),
        fmt(gstAmount),
        fmt(totalAmount),
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: C.primary,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: C.dark,
      cellPadding: { top: 7, bottom: 7, left: 4, right: 4 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: C.lightBg },
    tableLineColor: C.border,
    tableLineWidth: 0.3,
  });

  const afterTable = doc.lastAutoTable.finalY;

  // ─── TOTALS BLOCK ────────────────────────────────────────────────────────
  const tX = W - 100;
  const tW = 88;
  let tY = afterTable + 6;

  fill(doc, C.lightBg);
  doc.roundedRect(tX, tY, tW, 46, 3, 3, "F");

  // helper row
  const row = (label, value, y, isBold, isHighlight) => {
    if (isHighlight) {
      fill(doc, C.primary);
      doc.roundedRect(tX, y - 5, tW, 12, 2, 2, "F");
    }
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 10 : 9.5);
    txt(doc, isHighlight ? C.white : (isBold ? C.dark : C.muted));
    doc.text(label, tX + 6, y + 1);
    doc.text(value, tX + tW - 6, y + 1, { align: "right" });
  };

  row(`Base Amount:`, fmt(BASE_AMOUNT), tY + 9,  false, false);
  row(`GST (${gstPct}%):`,   fmt(gstAmount),   tY + 21, false, false);

  stroke(doc, C.border);
  doc.setLineWidth(0.5);
  doc.line(tX + 4, tY + 28, tX + tW - 4, tY + 28);

  row("TOTAL AMOUNT", fmt(totalAmount), tY + 39, true, true);

  // Amount in words (dynamic)
  const amtInWords = `Amount in words: ${totalAmount.toLocaleString("en-IN")} Rupees Only`;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  txt(doc, C.muted);
  doc.text(amtInWords, 12, afterTable + 54);

  // ─── TERMS + SIGNATURE ───────────────────────────────────────────────────
  const termsY = afterTable + 62;

  fill(doc, C.lightBg);
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, termsY, 120, 34, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  txt(doc, C.primary);
  doc.text("Terms & Conditions", 17, termsY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  txt(doc, C.muted);
  [
    "1. This invoice is valid for the current academic year only.",
    "2. Payment once received will not be refunded.",
    "3. Certificate issued upon successful completion of internship.",
  ].forEach((t, i) => doc.text(t, 17, termsY + 18 + i * 6.5));

  // Signature box (taller to fit signature image)
  const sigBoxH = 46;
  fill(doc, C.white);
  stroke(doc, C.border);
  doc.roundedRect(W - 100, termsY, 88, sigBoxH, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  txt(doc, C.primary);
  doc.text("Authorized Signature", W - 94, termsY + 9);

  // Embed signature image
  const sigB64 = await toBase64(signatureImg);
  if (sigB64) {
    // Centre the signature image horizontally inside the box
    const sigW = 55;
    const sigH = 18;
    const sigX = W - 100 + (88 - sigW) / 2;
    doc.addImage(sigB64, "PNG", sigX, termsY + 11, sigW, sigH);
  }

  // Separator line below signature
  stroke(doc, C.muted);
  doc.setLineWidth(0.4);
  doc.line(W - 94, termsY + 31, W - 14, termsY + 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  txt(doc, C.dark);
  doc.text("Founder & CEO", W - 94, termsY + 37);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  txt(doc, C.muted);
  doc.text("Carezza Global Solutions", W - 94, termsY + 43);

  // ─── FOOTER BAND ─────────────────────────────────────────────────────────
  fill(doc, C.footerBg);
  doc.rect(0, H - 16, W, 16, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  txt(doc, "#96a0c8");
  doc.text(
    "This is a computer-generated invoice and does not require a physical signature.",
    W / 2, H - 9,
    { align: "center" }
  );
  txt(doc, C.primary);
  doc.text("www.teamcarrezza.com", W / 2, H - 4, { align: "center" });

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const fileName = candidate.name ? `${candidate.name}.pdf` : "Invoice.pdf";
  doc.save(fileName);
};
