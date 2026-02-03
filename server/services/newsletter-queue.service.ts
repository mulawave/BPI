/**
 * Newsletter Queue Service
 * 
 * In-memory queue system for scheduled newsletter campaigns.
 * NOTE: Uses in-memory storage - will reset on server restart.
 * For production persistence, integrate with Redis/BullMQ or similar.
 */

import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

interface NewsletterJob {
  id: string;
  scheduledFor: Date;
  filter: 'all' | 'activated' | 'non-activated' | 'membership';
  membershipPackage?: string;
  fromEmail?: string;
  replyToEmail?: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: string }>;
  embeddedImages?: Array<{ id: string; content: string; position: number }>;
  sendRate: { emails: number; interval: number };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
  stats?: {
    total: number;
    sent: number;
    failed: number;
    duration: number;
  };
}

class NewsletterQueueService {
  private queue: Map<string, NewsletterJob> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    // Start queue processor (checks every minute)
    this.startProcessor();
  }

  /**
   * Schedule a newsletter campaign
   */
  async scheduleNewsletter(job: Omit<NewsletterJob, 'id' | 'status' | 'createdAt'>): Promise<NewsletterJob> {
    const newsletterJob: NewsletterJob = {
      id: randomUUID(),
      status: 'pending',
      createdAt: new Date(),
      ...job,
    };

    this.queue.set(newsletterJob.id, newsletterJob);
    
    console.log(`📅 [NEWSLETTER-QUEUE] Scheduled: ${newsletterJob.id} for ${newsletterJob.scheduledFor.toISOString()}`);
    console.log(`📊 [NEWSLETTER-QUEUE] Queue size: ${this.queue.size}`);

    return newsletterJob;
  }

  /**
   * Get all queued newsletters
   */
  getQueue(): NewsletterJob[] {
    return Array.from(this.queue.values()).sort((a, b) => 
      a.scheduledFor.getTime() - b.scheduledFor.getTime()
    );
  }

  /**
   * Get newsletter by ID
   */
  getJob(id: string): NewsletterJob | undefined {
    return this.queue.get(id);
  }

  /**
   * Cancel a scheduled newsletter
   */
  cancelJob(id: string): boolean {
    const job = this.queue.get(id);
    if (!job) return false;
    
    if (job.status === 'processing') {
      throw new Error('Cannot cancel newsletter that is currently processing');
    }

    if (job.status === 'pending') {
      job.status = 'cancelled';
      this.queue.set(id, job);
      console.log(`❌ [NEWSLETTER-QUEUE] Cancelled: ${id}`);
      return true;
    }

    return false;
  }

  /**
   * Delete a completed/failed/cancelled job
   */
  deleteJob(id: string): boolean {
    const job = this.queue.get(id);
    if (!job) return false;

    if (job.status === 'processing' || job.status === 'pending') {
      throw new Error('Cannot delete active or pending newsletter. Cancel it first.');
    }

    this.queue.delete(id);
    console.log(`🗑️ [NEWSLETTER-QUEUE] Deleted: ${id}`);
    return true;
  }

  /**
   * Start the background processor
   */
  private startProcessor() {
    if (this.processingInterval) return;

    // Check every minute for due newsletters
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 60 * 1000); // 60 seconds

    console.log('🚀 [NEWSLETTER-QUEUE] Processor started (checking every 60 seconds)');
  }

  /**
   * Stop the background processor
   */
  stopProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('🛑 [NEWSLETTER-QUEUE] Processor stopped');
    }
  }

  /**
   * Process due newsletters
   */
  private async processQueue() {
    if (this.isProcessing) {
      console.log('⏭️ [NEWSLETTER-QUEUE] Already processing, skipping this cycle');
      return;
    }

    this.isProcessing = true;
    const now = new Date();

    try {
      const dueJobs = Array.from(this.queue.values()).filter(
        job => job.status === 'pending' && job.scheduledFor <= now
      );

      if (dueJobs.length === 0) {
        // No jobs to process
        return;
      }

      console.log(`\n📬 [NEWSLETTER-QUEUE] Processing ${dueJobs.length} due newsletter(s)...`);

      for (const job of dueJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('❌ [NEWSLETTER-QUEUE] Processor error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single newsletter job
   */
  private async processJob(job: NewsletterJob) {
    console.log(`\n📧 [NEWSLETTER-QUEUE] Processing job: ${job.id}`);
    console.log(`📋 [NEWSLETTER-QUEUE] Subject: ${job.subject}`);
    
    // Mark as processing
    job.status = 'processing';
    this.queue.set(job.id, job);

    const startTime = Date.now();
    let sent = 0;
    let failed = 0;

    try {
      // Build recipient query based on filter
      const whereClause: any = {};
      
      if (job.filter === 'activated') {
        whereClause.membershipActivatedAt = { not: null };
      } else if (job.filter === 'non-activated') {
        whereClause.membershipActivatedAt = null;
      } else if (job.filter === 'membership' && job.membershipPackage) {
        whereClause.membershipPackageId = job.membershipPackage;
      }

      // Fetch recipients
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
        },
      });

      // Filter out invalid emails
      const recipients = users.filter((u: any) => u.email && u.email.includes('@'));
      const total = recipients.length;

      console.log(`👥 [NEWSLETTER-QUEUE] Recipients: ${total} users`);

      if (total === 0) {
        job.status = 'completed';
        job.processedAt = new Date();
        job.stats = { total: 0, sent: 0, failed: 0, duration: 0 };
        this.queue.set(job.id, job);
        console.log('⚠️ [NEWSLETTER-QUEUE] No recipients found, marking as completed');
        return;
      }

      // Process in batches with rate limiting
      const batchSize = job.sendRate.emails;
      const batches: typeof recipients[] = [];
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      const totalBatches = batches.length;
      console.log(`⚙️ [NEWSLETTER-QUEUE] Batch config: ${batchSize} emails per ${job.sendRate.interval} minutes`);

      // Helper function to build newsletter HTML (same as original implementation)
      const buildNewsletterEmail = (params: any) => {
        const { userFirstName, userLastName, bodyContent, embeddedImages } = params;
        
        let processedBody = bodyContent;
        if (embeddedImages && embeddedImages.length > 0) {
          embeddedImages.forEach((img: any) => {
            processedBody = processedBody.replace(
              new RegExp(`\\[IMAGE_${img.id}\\]`, 'g'),
              `<img src="cid:${img.id}" style="max-width: 100%; height: auto;" />`
            );
          });
        }

        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0d3b29 0%, #1a5c3f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
              .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>BPI Newsletter</h1>
              </div>
              <div class="content">
                <p>Dear ${userFirstName} ${userLastName},</p>
                ${processedBody}
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} BPI. All rights reserved.</p>
                <p>You received this email because you are a member of BPI.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      };

      // Send batches with delays
      for (let batchNum = 0; batchNum < batches.length; batchNum++) {
        const batch = batches[batchNum];
        console.log(`\n📦 [NEWSLETTER-QUEUE] Processing batch ${batchNum + 1}/${totalBatches} (${batch.length} emails)`);

        // Send all emails in this batch
        const batchPromises = batch.map(async (recipient: any) => {
          try {
            const emailHtml = buildNewsletterEmail({
              userFirstName: recipient.firstname || '',
              userLastName: recipient.lastname || '',
              bodyContent: job.body,
              embeddedImages: job.embeddedImages,
            });

            const emailOptions: any = {
              to: recipient.email,
              from: job.fromEmail,
              subject: job.subject,
              html: emailHtml,
            };

            if (job.replyToEmail) {
              emailOptions.replyTo = job.replyToEmail;
            }

            if (job.attachments && job.attachments.length > 0) {
              emailOptions.attachments = job.attachments.map((att: any) => ({
                filename: att.filename,
                content: Buffer.from(att.content, 'base64'),
              }));
            }

            if (job.embeddedImages && job.embeddedImages.length > 0) {
              const embeddedAttachments = job.embeddedImages.map((img: any) => ({
                filename: `${img.id}.png`,
                content: Buffer.from(img.content, 'base64'),
                cid: img.id,
              }));
              emailOptions.attachments = [
                ...(emailOptions.attachments || []),
                ...embeddedAttachments,
              ];
            }

            await sendEmail(emailOptions);
            sent++;

            // Audit log
            await prisma.auditLog.create({
              data: {
                id: randomUUID(),
                userId: job.createdBy,
                action: 'NEWSLETTER_SEND_SCHEDULED',
                entity: 'newsletter',
                entityId: job.id,
                metadata: { recipientEmail: recipient.email, jobId: job.id, subject: job.subject },
              },
            });

            console.log(`✅ [NEWSLETTER-QUEUE] Progress: ${sent}/${total} sent (${failed} failed)`);
          } catch (error: any) {
            failed++;
            console.error(`❌ [NEWSLETTER-QUEUE] Failed to send to ${recipient.email}:`, error.message);

            // Audit log for failure
            await prisma.auditLog.create({
              data: {
                id: randomUUID(),
                userId: job.createdBy,
                action: 'NEWSLETTER_SEND_FAILED_SCHEDULED',
                entity: 'newsletter',
                entityId: job.id,
                metadata: { error: error.message, recipientEmail: recipient.email, jobId: job.id, subject: job.subject },
              },
            });
          }
        });

        // Wait for batch to complete
        await Promise.all(batchPromises);

        // Wait before next batch (except for last batch)
        if (batchNum < batches.length - 1) {
          const delayMs = job.sendRate.interval * 60 * 1000;
          console.log(`⏳ [NEWSLETTER-QUEUE] Waiting ${job.sendRate.interval} minutes before next batch...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // Calculate duration
      const duration = Math.round((Date.now() - startTime) / 1000 / 60);

      // Mark as completed
      job.status = 'completed';
      job.processedAt = new Date();
      job.stats = { total, sent, failed, duration };
      this.queue.set(job.id, job);

      console.log(`\n✅ [NEWSLETTER-QUEUE] Job completed: ${job.id}`);
      console.log(`📊 [NEWSLETTER-QUEUE] Stats: ${sent} sent, ${failed} failed, ${total} total in ${duration} minutes`);

      // Send admin notification if there were failures
      if (failed > 0) {
        try {
          const adminUsers = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { email: true },
          });

          for (const admin of adminUsers) {
            if (admin.email) {
              await sendEmail({
                to: admin.email,
                subject: `⚠️ Scheduled Newsletter Alert - ${failed} Failed Deliveries (Job: ${job.id})`,
                html: `
                  <h1>⚠️ Scheduled Newsletter Campaign Alert</h1>
                  <p>A scheduled newsletter campaign has completed with failures:</p>
                  <ul>
                    <li><strong>Job ID:</strong> ${job.id}</li>
                    <li><strong>Subject:</strong> ${job.subject}</li>
                    <li><strong>Scheduled For:</strong> ${job.scheduledFor.toISOString()}</li>
                    <li><strong>Total Recipients:</strong> ${total}</li>
                    <li><strong>Successfully Sent:</strong> ${sent}</li>
                    <li><strong>Failed:</strong> ${failed}</li>
                    <li><strong>Failure Rate:</strong> ${((failed / total) * 100).toFixed(2)}%</li>
                    <li><strong>Duration:</strong> ${duration} minutes</li>
                  </ul>
                  <p>Please check audit logs for detailed error information.</p>
                `,
              });
            }
          }
        } catch (notificationError) {
          console.error('❌ [NEWSLETTER-QUEUE] Failed to send admin notification:', notificationError);
        }
      }

    } catch (error: any) {
      console.error(`❌ [NEWSLETTER-QUEUE] Job failed: ${job.id}`, error);
      
      // Mark as failed
      job.status = 'failed';
      job.processedAt = new Date();
      job.error = error.message;
      job.stats = { total: 0, sent, failed, duration: Math.round((Date.now() - startTime) / 1000 / 60) };
      this.queue.set(job.id, job);
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.queue.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
    };
  }
}

// Singleton instance
export const newsletterQueue = new NewsletterQueueService();
