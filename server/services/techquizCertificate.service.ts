export interface TechQuizCertificateData {
  childName: string;
  schoolName: string;
  state: string;
  eventTitle: string;
  finalRank: number;
  awardBracket: string;
  certifiedAt: Date;
  applicationId: string;
}

export function generateTechQuizCertificateHTML(data: TechQuizCertificateData): string {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

  const rankSuffix = (n: number) => {
    if (n === 11 || n === 12 || n === 13) return "th";
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const rankLabel = `${data.finalRank}${rankSuffix(data.finalRank)} Place`;

  const badgeColor =
    data.finalRank === 1
      ? "#FFD700"
      : data.finalRank === 2
      ? "#C0C0C0"
      : data.finalRank === 3
      ? "#CD7F32"
      : "#1a5c3a";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TechQuiz Certificate – ${data.childName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      background: #f5f0e8;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .certificate {
      width: 860px;
      min-height: 620px;
      background: #fff;
      border: 3px solid #1a5c3a;
      border-radius: 4px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      position: relative;
      padding: 56px 64px;
      overflow: hidden;
    }
    .corner {
      position: absolute;
      width: 80px;
      height: 80px;
      border: 3px solid ${badgeColor};
    }
    .corner.tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
    .corner.tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
    .corner.bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
    .corner.br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 120px;
      font-weight: 900;
      color: rgba(26,92,58,0.04);
      pointer-events: none;
      white-space: nowrap;
      font-family: 'Playfair Display', serif;
      letter-spacing: 0.05em;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .org-name {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #1a5c3a;
      margin-bottom: 6px;
    }
    .cert-title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 900;
      color: #0d3b29;
      line-height: 1.1;
    }
    .cert-subtitle {
      font-size: 13px;
      color: #888;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .divider {
      width: 120px;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${badgeColor}, transparent);
      margin: 20px auto;
    }
    .presented-to {
      text-align: center;
      font-size: 13px;
      color: #777;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .recipient-name {
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 38px;
      font-weight: 700;
      color: #0d3b29;
      margin-bottom: 4px;
    }
    .school-info {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 24px;
    }
    .achievement-block {
      text-align: center;
      margin-bottom: 28px;
    }
    .achievement-text {
      font-size: 14px;
      color: #555;
      line-height: 1.7;
      max-width: 560px;
      margin: 0 auto;
    }
    .badge-row {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-bottom: 40px;
    }
    .badge {
      background: ${badgeColor}18;
      border: 2px solid ${badgeColor};
      border-radius: 50px;
      padding: 10px 28px;
      text-align: center;
    }
    .badge-label {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 2px;
    }
    .badge-value {
      font-size: 18px;
      font-weight: 700;
      color: ${badgeColor === "#FFD700" ? "#b8860b" : badgeColor === "#C0C0C0" ? "#777" : badgeColor === "#CD7F32" ? "#8B4513" : "#1a5c3a"};
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e5e5e5;
      padding-top: 24px;
    }
    .footer-item {
      text-align: center;
    }
    .footer-item .line {
      width: 140px;
      height: 1px;
      background: #ccc;
      margin: 0 auto 6px;
    }
    .footer-label {
      font-size: 11px;
      color: #aaa;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .footer-value {
      font-size: 12px;
      color: #555;
      margin-top: 2px;
    }
    .seal {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 3px solid ${badgeColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: ${badgeColor === "#FFD700" ? "#b8860b" : "#1a5c3a"};
      letter-spacing: 1px;
      text-align: center;
      line-height: 1.3;
      text-transform: uppercase;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .certificate { box-shadow: none; border: 2px solid #1a5c3a; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="watermark">BPI</div>

    <div class="header">
      <div class="org-name">BPI &mdash; TechQuiz Competition</div>
      <div class="cert-title">Certificate of Achievement</div>
      <div class="cert-subtitle">Official Award Document</div>
    </div>

    <div class="divider"></div>

    <div class="presented-to">This certificate is proudly presented to</div>
    <div class="recipient-name">${data.childName}</div>
    <div class="school-info">${data.schoolName} &bull; ${data.state}</div>

    <div class="achievement-block">
      <div class="achievement-text">
        For outstanding performance and dedication in the<br />
        <strong>${data.eventTitle}</strong><br />
        achieving a distinguished ranking among all competing participants.
      </div>
    </div>

    <div class="badge-row">
      <div class="badge">
        <div class="badge-label">Final Rank</div>
        <div class="badge-value">${rankLabel}</div>
      </div>
      <div class="badge">
        <div class="badge-label">Award</div>
        <div class="badge-value">${data.awardBracket}</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-item">
        <div class="line"></div>
        <div class="footer-label">Authorised by</div>
        <div class="footer-value">BPI Competition Board</div>
      </div>
      <div class="seal">BPI<br />VERIFIED</div>
      <div class="footer-item">
        <div class="line"></div>
        <div class="footer-label">Date Issued</div>
        <div class="footer-value">${formatDate(data.certifiedAt)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
