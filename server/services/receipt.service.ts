import { prisma } from "@/lib/prisma";

export interface DepositReceiptData {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  vatAmount: number;
  totalPaid: number;
  reference: string;
  paymentMethod: string;
  transactionDate: Date;
}

export interface WithdrawalReceiptData {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  reference: string;
  withdrawalType: 'cash' | 'bpt';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bnbWalletAddress?: string;
  transactionDate: Date;
  status: string;
}

/**
 * Generate HTML receipt for deposit transactions
 */
export function generateDepositReceiptHTML(data: DepositReceiptData): string {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deposit Receipt - BeepAgro Africa</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          color: #1a202c;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          padding: 40px;
          text-align: center;
          color: white;
          position: relative;
        }
        
        .receipt-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
          background-size: cover;
          background-position: bottom;
        }
        
        .company-logo {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .receipt-type {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .status-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 24px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .receipt-body {
          padding: 40px;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        
        .info-value {
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }
        
        .amount-breakdown {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 15px;
        }
        
        .breakdown-label {
          color: #374151;
          font-weight: 500;
        }
        
        .breakdown-value {
          color: #1f2937;
          font-weight: 600;
        }
        
        .total-row {
          border-top: 2px solid #3b82f6;
          margin-top: 12px;
          padding-top: 16px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .total-row .breakdown-label {
          color: #1e40af;
        }
        
        .total-row .breakdown-value {
          color: #1e40af;
        }
        
        .receipt-footer {
          background: #f9fafb;
          padding: 32px 40px;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        
        .footer-contact {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
        }
        
        .footer-contact a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .reference-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: 600;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .receipt-container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <div class="company-logo">🌾</div>
          <div class="company-name">BeepAgro Africa</div>
          <div class="receipt-type">Deposit Receipt</div>
          <div class="status-badge">✓ Completed</div>
        </div>
        
        <div class="receipt-body">
          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="info-row">
              <span class="info-label">Transaction Reference</span>
              <span class="info-value"><span class="reference-badge">${data.reference}</span></span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Date</span>
              <span class="info-value">${formatDate(data.transactionDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method</span>
              <span class="info-value">${data.paymentMethod.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">${data.transactionId}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="info-label">Name</span>
              <span class="info-value">${data.userName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Customer ID</span>
              <span class="info-value">${data.userId.substring(0, 12).toUpperCase()}</span>
            </div>
          </div>
          
          <div class="amount-breakdown">
            <div class="breakdown-row">
              <span class="breakdown-label">Deposit Amount</span>
              <span class="breakdown-value">${formatCurrency(data.amount)}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label">VAT (7.5%)</span>
              <span class="breakdown-value">${formatCurrency(data.vatAmount)}</span>
            </div>
            <div class="breakdown-row total-row">
              <span class="breakdown-label">Total Paid</span>
              <span class="breakdown-value">${formatCurrency(data.totalPaid)}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Important Information</div>
            <div class="footer-text">
              This is an official receipt for your deposit transaction. The amount of ${formatCurrency(data.amount)} 
              has been successfully credited to your BeepAgro Africa wallet. Please keep this receipt for your records.
            </div>
          </div>
        </div>
        
        <div class="receipt-footer">
          <div class="footer-text">
            Thank you for choosing BeepAgro Africa! For any questions or concerns regarding this transaction, 
            please contact our support team.
          </div>
          <div class="footer-contact">
            Email: <a href="mailto:support@beepagro.africa">support@beepagro.africa</a> | 
            Phone: +234 (0) 800 BEEPAGRO | 
            Website: <a href="https://beepagro.africa">www.beepagro.africa</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML receipt for withdrawal transactions
 */
export function generateWithdrawalReceiptHTML(data: WithdrawalReceiptData): string {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statusColor = data.status === 'completed' ? '#10b981' : '#f59e0b';
  const statusText = data.status === 'completed' ? '✓ Completed' : '⏳ Processing';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Withdrawal Receipt - BeepAgro Africa</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          color: #1a202c;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          padding: 40px;
          text-align: center;
          color: white;
          position: relative;
        }
        
        .receipt-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
          background-size: cover;
          background-position: bottom;
        }
        
        .company-logo {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .receipt-type {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .status-badge {
          display: inline-block;
          background: ${statusColor};
          color: white;
          padding: 8px 24px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .receipt-body {
          padding: 40px;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        
        .info-value {
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }
        
        .amount-breakdown {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 15px;
        }
        
        .breakdown-label {
          color: #374151;
          font-weight: 500;
        }
        
        .breakdown-value {
          color: #1f2937;
          font-weight: 600;
        }
        
        .total-row {
          border-top: 2px solid #dc2626;
          margin-top: 12px;
          padding-top: 16px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .total-row .breakdown-label {
          color: #991b1b;
        }
        
        .total-row .breakdown-value {
          color: #991b1b;
        }
        
        .bank-details {
          background: #f0fdf4;
          border-left: 4px solid #10b981;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .crypto-details {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .receipt-footer {
          background: #f9fafb;
          padding: 32px 40px;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        
        .footer-contact {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
        }
        
        .footer-contact a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .reference-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: 600;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .receipt-container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <div class="company-logo">🌾</div>
          <div class="company-name">BeepAgro Africa</div>
          <div class="receipt-type">Withdrawal Receipt</div>
          <div class="status-badge">${statusText}</div>
        </div>
        
        <div class="receipt-body">
          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="info-row">
              <span class="info-label">Transaction Reference</span>
              <span class="info-value"><span class="reference-badge">${data.reference}</span></span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Date</span>
              <span class="info-value">${formatDate(data.transactionDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Withdrawal Type</span>
              <span class="info-value">${data.withdrawalType === 'cash' ? 'Cash to Bank' : 'BPT to Crypto Wallet'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">${data.transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value">${data.status.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="info-label">Name</span>
              <span class="info-value">${data.userName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${data.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Customer ID</span>
              <span class="info-value">${data.userId.substring(0, 12).toUpperCase()}</span>
            </div>
          </div>
          
          <div class="amount-breakdown">
            <div class="breakdown-row">
              <span class="breakdown-label">Withdrawal Amount</span>
              <span class="breakdown-value">${formatCurrency(data.amount)}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label">Processing Fee</span>
              <span class="breakdown-value">${formatCurrency(data.fee)}</span>
            </div>
            <div class="breakdown-row total-row">
              <span class="breakdown-label">Net Amount</span>
              <span class="breakdown-value">${formatCurrency(data.netAmount)}</span>
            </div>
          </div>
          
          ${data.withdrawalType === 'cash' && data.bankName ? `
          <div class="bank-details">
            <div class="section-title" style="border-bottom: none; margin-bottom: 12px;">Bank Details</div>
            <div class="info-row">
              <span class="info-label">Bank Name</span>
              <span class="info-value">${data.bankName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Number</span>
              <span class="info-value">${data.accountNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Name</span>
              <span class="info-value">${data.accountName}</span>
            </div>
          </div>
          ` : ''}
          
          ${data.withdrawalType === 'bpt' && data.bnbWalletAddress ? `
          <div class="crypto-details">
            <div class="section-title" style="border-bottom: none; margin-bottom: 12px;">Crypto Wallet Details</div>
            <div class="info-row">
              <span class="info-label">Wallet Type</span>
              <span class="info-value">BNB Chain (BEP-20)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Wallet Address</span>
              <span class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all;">${data.bnbWalletAddress}</span>
            </div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Important Information</div>
            <div class="footer-text">
              ${data.status === 'completed' 
                ? `This is an official receipt for your withdrawal transaction. The amount of ${formatCurrency(data.netAmount)} has been successfully ${data.withdrawalType === 'cash' ? 'transferred to your bank account' : 'sent to your crypto wallet'}.`
                : 'Your withdrawal is being processed. You will receive a notification once the transfer is completed.'}
              Please keep this receipt for your records.
            </div>
          </div>
        </div>
        
        <div class="receipt-footer">
          <div class="footer-text">
            Thank you for using BeepAgro Africa! For any questions or concerns regarding this transaction, 
            please contact our support team.
          </div>
          <div class="footer-contact">
            Email: <a href="mailto:support@beepagro.africa">support@beepagro.africa</a> | 
            Phone: +234 (0) 800 BEEPAGRO | 
            Website: <a href="https://beepagro.africa">www.beepagro.africa</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate receipt link for a transaction
 */
export function generateReceiptLink(transactionId: string, type: 'deposit' | 'withdrawal'): string {
  return `/api/receipt/${type}/${transactionId}`;
}
