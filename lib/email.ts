import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
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
