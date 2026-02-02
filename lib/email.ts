import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}

async function getSmtpConfig() {
  const settings = await prisma.adminSettings.findMany({
    where: {
      settingKey: {
        in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpSecure', 'smtpFromEmail', 'smtpFromName']
      }
    }
  });

  const config: Record<string, string> = {};
  settings.forEach(setting => {
    config[setting.settingKey] = setting.settingValue;
  });

  return {
    host: config.smtpHost || process.env.SMTP_HOST,
    port: parseInt(config.smtpPort || process.env.SMTP_PORT || '587'),
    secure: config.smtpSecure === 'true',
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPassword || process.env.SMTP_PASSWORD,
    },
    fromEmail: config.smtpFromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@beepagroafrica.com',
    fromName: config.smtpFromName || process.env.SMTP_FROM_NAME || 'BPI Team',
  };
}

export async function sendEmail(options: EmailOptions) {
  try {
    const config = await getSmtpConfig();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    // Send email
    await transporter.sendMail({
      from: options.from || `${config.fromName} <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-new-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #1a5c3f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #0d3b29; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your BPI account. Click the button below to set a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your BPI Password',
    html,
  });
}

export async function sendVerificationEmail(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #1a5c3f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; color: #0d3b29; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering with BPI. Please use the verification code below to verify your email address:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your BPI Email Address',
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #1a5c3f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #0d3b29; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to BPI!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Welcome to the BeepAgro Progress Initiative! We're excited to have you as part of our community.</p>
            <p>Get started by exploring your dashboard and connecting with other members:</p>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Visit Dashboard</a>
            </p>
            <p>If you have any questions, our support team is here to help.</p>
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to BPI',
    html,
  });
}

// ============================================
// WITHDRAWAL EMAIL NOTIFICATIONS
// ============================================

export async function sendWithdrawalRequestToAdmins(
  userName: string,
  userEmail: string,
  amount: number,
  withdrawalType: 'cash' | 'bpt',
  reference: string
) {
  // Get all admin emails
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'super_admin'] }
    },
    select: { email: true, name: true }
  });

  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/withdrawals`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info-grid { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { color: #111827; font-weight: 500; }
          .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Withdrawal Request</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>⚠️ Action Required</strong><br>
              A user has submitted a withdrawal request that requires your approval.
            </div>
            
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">User:</span>
                <span class="info-value">${userName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${userEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Amount:</span>
                <span class="info-value" style="color: #dc2626; font-size: 18px;">₦${amount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type:</span>
                <span class="info-value">${withdrawalType === 'cash' ? 'Cash (Bank Transfer)' : 'BPT Token'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span class="info-value" style="font-family: monospace;">${reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Submitted:</span>
                <span class="info-value">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${adminUrl}" class="button">Review & Approve Withdrawal</a>
            </p>

            <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
              Please review this request promptly. The user will be notified once you approve or reject this withdrawal.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
            <p>This is an automated admin notification. Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to all admins
  const emailPromises = admins.map(admin =>
    sendEmail({
      to: admin.email || '',
      subject: `🔔 New Withdrawal Request - ₦${amount.toLocaleString()} from ${userName}`,
      html,
    }).catch(error => {
      console.error(`Failed to send withdrawal notification to ${admin.email}:`, error);
    })
  );

  await Promise.allSettled(emailPromises);
}

export async function sendWithdrawalApprovedToUser(
  email: string,
  name: string,
  amount: number,
  withdrawalType: 'cash' | 'bpt',
  reference: string,
  receiptUrl?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .amount-box { text-align: center; background: white; padding: 30px; border-radius: 10px; margin: 20px 0; }
          .amount { font-size: 36px; font-weight: bold; color: #059669; }
          .button { display: inline-block; padding: 12px 30px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Withdrawal Approved</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            
            <div class="success-box">
              <strong>✅ Great news!</strong><br>
              Your withdrawal request has been approved and processed.
            </div>

            <div class="amount-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">You've Withdrawn</p>
              <div class="amount">₦${amount.toLocaleString()}</div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-family: monospace;">${reference}</p>
            </div>

            <p><strong>Withdrawal Details:</strong></p>
            <ul>
              <li><strong>Type:</strong> ${withdrawalType === 'cash' ? 'Bank Transfer' : 'BPT Token Transfer'}</li>
              <li><strong>Status:</strong> <span style="color: #059669;">Completed</span></li>
              <li><strong>Processing Time:</strong> ${withdrawalType === 'cash' ? '1-2 business days' : 'Within 24 hours'}</li>
            </ul>

            ${withdrawalType === 'cash' 
              ? '<p>The funds will be transferred to your registered bank account shortly. Please allow 1-2 business days for the transfer to reflect in your account.</p>' 
              : '<p>Your BPT tokens will be transferred to your registered BNB wallet address within 24 hours.</p>'
            }

            ${receiptUrl ? `
              <p style="text-align: center;">
                <a href="${receiptUrl}" class="button">Download Receipt</a>
              </p>
            ` : ''}

            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `✅ Withdrawal Approved - ₦${amount.toLocaleString()}`,
    html,
  });
}

export async function sendWithdrawalRejectedToUser(
  email: string,
  name: string,
  amount: number,
  reference: string,
  reason: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .amount-box { text-align: center; background: white; padding: 30px; border-radius: 10px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #0d3b29; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Withdrawal Rejected</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            
            <div class="warning-box">
              <strong>⚠️ Important Notice</strong><br>
              Your withdrawal request has been rejected by our admin team.
            </div>

            <div class="amount-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Rejected Amount</p>
              <div style="font-size: 36px; font-weight: bold; color: #dc2626;">₦${amount.toLocaleString()}</div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-family: monospace;">${reference}</p>
            </div>

            <p><strong>Reason for Rejection:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626;">
              ${reason}
            </div>

            <p><strong>What Happens Next?</strong></p>
            <ul>
              <li>The full amount (including fees) has been refunded to your wallet</li>
              <li>You can check your wallet balance in your dashboard</li>
              <li>If you believe this was an error, please contact support</li>
            </ul>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Dashboard</a>
            </p>

            <p>If you have any questions or concerns, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `❌ Withdrawal Rejected - ₦${amount.toLocaleString()}`,
    html,
  });
}

export async function sendTransferConfirmationToUser(
  email: string,
  userName: string,
  amount: number,
  fromWallet: string,
  toWallet: string,
  reference: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info-grid { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { color: #111827; font-weight: 500; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Transfer Successful</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            
            <div class="success-box">
              <strong>✓ Your wallet transfer has been completed successfully!</strong>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Amount:</span>
                <span class="info-value">₦${amount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">From Wallet:</span>
                <span class="info-value">${fromWallet}</span>
              </div>
              <div class="info-row">
                <span class="info-label">To Wallet:</span>
                <span class="info-value">${toWallet}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span class="info-value">${reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
              </div>
            </div>

            <p>This transfer was processed instantly. Your ${toWallet} balance has been updated.</p>

            <p>If you did not authorize this transfer, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `✅ Wallet Transfer Complete - ₦${amount.toLocaleString()}`,
    html,
  });
}

export async function sendTransferToUserConfirmation(
  senderEmail: string,
  senderName: string,
  receiverName: string,
  amount: number,
  reference: string,
  isSender: boolean
) {
  const html = isSender ? `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info-grid { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { color: #111827; font-weight: 500; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💸 Money Sent Successfully</h1>
          </div>
          <div class="content">
            <p>Dear ${senderName},</p>
            
            <div class="success-box">
              <strong>✓ Your transfer to ${receiverName} has been completed!</strong>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Amount Sent:</span>
                <span class="info-value">₦${amount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Recipient:</span>
                <span class="info-value">${receiverName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span class="info-value">${reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
              </div>
            </div>

            <p>The funds have been transferred instantly. Your wallet balance has been updated.</p>

            <p>If you did not authorize this transfer, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info-grid { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { color: #111827; font-weight: 500; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Money Received!</h1>
          </div>
          <div class="content">
            <p>Dear ${receiverName},</p>
            
            <div class="success-box">
              <strong>✓ You've received money from ${senderName}!</strong>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Amount Received:</span>
                <span class="info-value">₦${amount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">From:</span>
                <span class="info-value">${senderName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span class="info-value">${reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
              </div>
            </div>

            <p>The funds have been credited to your wallet instantly. You can now use this balance for purchases, withdrawals, or other transactions.</p>

            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: senderEmail,
    subject: isSender 
      ? `💸 Transfer Sent - ₦${amount.toLocaleString()} to ${receiverName}`
      : `💰 Money Received - ₦${amount.toLocaleString()} from ${senderName}`,
    html,
  });
}

export async function sendRenewalReminderEmail(
  email: string,
  userName: string,
  packageName: string,
  expiryDate: Date,
  daysUntilExpiry: number,
  renewalFee: number
) {
  const renewalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/membership`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d3b29 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info-grid { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { color: #111827; font-weight: 500; }
          .button { display: inline-block; padding: 12px 30px; background: #0d3b29; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .urgent { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Membership Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            
            <div class="warning-box">
              <strong>⚠️ Your membership is expiring soon!</strong>
            </div>

            <p>This is a friendly reminder that your <strong>${packageName}</strong> membership will expire in <span class="${daysUntilExpiry <= 7 ? 'urgent' : ''}">${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</span>.</p>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Membership Package:</span>
                <span class="info-value">${packageName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Expiry Date:</span>
                <span class="info-value ${daysUntilExpiry <= 7 ? 'urgent' : ''}">${expiryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Days Remaining:</span>
                <span class="info-value ${daysUntilExpiry <= 7 ? 'urgent' : ''}">${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Renewal Fee:</span>
                <span class="info-value">₦${renewalFee.toLocaleString()}</span>
              </div>
            </div>

            <p><strong>Why renew now?</strong></p>
            <ul>
              <li>Continue enjoying all membership benefits without interruption</li>
              <li>Maintain your referral network and bonus structure</li>
              <li>Keep access to exclusive features and rewards</li>
              <li>Avoid re-activation fees</li>
            </ul>

            <p style="text-align: center;">
              <a href="${renewalUrl}" class="button">Renew Membership Now</a>
            </p>

            ${daysUntilExpiry <= 7 ? `
              <div class="warning-box" style="background: #fee2e2; border-color: #dc2626;">
                <strong>🚨 URGENT: Only ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} remaining!</strong><br>
                Renew today to avoid service interruption.
              </div>
            ` : ''}

            <p>If you have any questions about renewal, please contact our support team.</p>
            
            <p>Best regards,<br>The BPI Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: daysUntilExpiry <= 7 
      ? `🚨 URGENT: ${packageName} Membership Expires in ${daysUntilExpiry} Days!`
      : `⏰ Reminder: ${packageName} Membership Expires in ${daysUntilExpiry} Days`,
    html,
  });
}
