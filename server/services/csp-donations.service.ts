import type { PrismaClient } from "@prisma/client";

export type CspDonationBadgeCategoryRecord = {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  badgeType: string;
  coolingReductionMonths: number;
  isActive: boolean;
  sortOrder: number;
};

export type CspDonationRecord = {
  id: string;
  donorName: string;
  donorEmail: string | null;
  organization: string | null;
  amount: number;
  category: string | null;
  badgeAwardedId: string | null;
  recognitionPref: string;
  status: string;
  certificateUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DonationDb = Pick<PrismaClient, "cspDonationBadgeCategory">;

export function buildCspDonationCertificateUrl(donationId: string) {
  return `/api/certificate/csp/${donationId}`;
}

export function resolveCspDonationBadgeCategory(
  categories: CspDonationBadgeCategoryRecord[],
  amount: number,
) {
  const sorted = [...categories].sort((a, b) => {
    if (a.minAmount !== b.minAmount) return a.minAmount - b.minAmount;
    return a.sortOrder - b.sortOrder;
  });

  return (
    sorted.find((category) => {
      const withinLowerBound = amount >= category.minAmount;
      const withinUpperBound =
        category.maxAmount === null || amount <= category.maxAmount;
      return withinLowerBound && withinUpperBound;
    }) ?? null
  );
}

export async function loadActiveCspDonationBadgeCategories(db: DonationDb) {
  return db.cspDonationBadgeCategory.findMany({
    where: { isActive: true },
    orderBy: [{ minAmount: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      minAmount: true,
      maxAmount: true,
      badgeType: true,
      coolingReductionMonths: true,
      isActive: true,
      sortOrder: true,
    },
  });
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function normalizePdfText(value: string) {
  return value
    .replace(/\u20a6/g, "NGN")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
}

function formatCurrency(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

function addTextLine(lines: string[], text: string) {
  lines.push(normalizePdfText(text));
}

function buildPdfContent(lines: string[]) {
  const commands: string[] = [];
  let y = 720;

  for (const line of lines) {
    const fontSize = line.startsWith("CERTIFICATE") ? 24 : line.startsWith("BeepAgro") ? 14 : 12;
    const safeLine = escapePdfText(normalizePdfText(line));
    commands.push(`BT /F1 ${fontSize} Tf 72 ${y} Td (${safeLine}) Tj ET`);
    y -= line.startsWith("CERTIFICATE") ? 34 : 22;
  }

  return commands.join("\n");
}

export function generateCspDonationCertificatePdf(input: {
  donation: {
    id: string;
    donorName: string;
    donorEmail: string | null;
    organization: string | null;
    amount: number;
    category: string | null;
    recognitionPref: string;
    createdAt: Date;
  };
  badgeCategory: CspDonationBadgeCategoryRecord | null;
  issuedAt?: Date;
}) {
  const issuedAt = input.issuedAt ?? new Date();
  const lines: string[] = [];

  addTextLine(lines, "BeepAgro Africa");
  addTextLine(lines, "Community Support Program");
  addTextLine(lines, "");
  addTextLine(lines, "CERTIFICATE OF RECOGNITION");
  addTextLine(lines, "");
  addTextLine(lines, `This certificate is awarded to ${input.donation.donorName}`);
  if (input.donation.organization) {
    addTextLine(lines, `Organization: ${input.donation.organization}`);
  }
  if (input.donation.donorEmail) {
    addTextLine(lines, `Email: ${input.donation.donorEmail}`);
  }
  addTextLine(lines, `For support of ${formatCurrency(input.donation.amount)}`);
  if (input.donation.category) {
    addTextLine(lines, `Recognition category: ${input.donation.category}`);
  }
  if (input.badgeCategory) {
    addTextLine(lines, `Badge type: ${input.badgeCategory.badgeType}`);
    addTextLine(
      lines,
      `Cooling reduction: ${input.badgeCategory.coolingReductionMonths} month(s)`,
    );
  }
  addTextLine(lines, "Time Reduction Badges never expire.");
  addTextLine(lines, `Issued: ${issuedAt.toISOString().slice(0, 10)}`);
  addTextLine(lines, `Certificate ID: ${input.donation.id}`);

  const content = buildPdfContent(lines);
  const pdfObjects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    [
      "3 0 obj",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]",
      "/Resources << /Font << /F1 4 0 R >> >>",
      "/Contents 5 0 R >>",
      "endobj",
    ].join("\n"),
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    [
      "5 0 obj",
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>`,
      "stream",
      content,
      "endstream",
      "endobj",
    ].join("\n"),
  ];

  let body = "";
  const offsets = [0];
  for (const object of pdfObjects) {
    offsets.push(Buffer.byteLength(`%PDF-1.4\n%âãÏÓ\n${body}`, "latin1"));
    body += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(`%PDF-1.4\n%âãÏÓ\n${body}`, "latin1");
  const xref = [
    "xref",
    `0 ${pdfObjects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  return Buffer.from(`%PDF-1.4\n%âãÏÓ\n${body}${xref}\n`, "latin1");
}
