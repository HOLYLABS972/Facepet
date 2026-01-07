'use server';

import { sendEmail, EmailOptions, EmailResult } from './email';

interface QueuedEmail extends EmailOptions {
  id: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt: number;
  createdAt: number;
}

// In-memory queue (for production, consider using Redis or a proper queue system)
const emailQueue: QueuedEmail[] = [];
const processing = new Set<string>();

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * Add email to queue
 */
export function queueEmail(
  options: EmailOptions,
  maxAttempts: number = MAX_ATTEMPTS
): string {
  const id = generateId();
  const queuedEmail: QueuedEmail = {
    ...options,
    id,
    attempts: 0,
    maxAttempts,
    scheduledAt: Date.now(),
    createdAt: Date.now()
  };

  emailQueue.push(queuedEmail);

  // Process immediately if not already processing
  if (!processing.has('processor')) {
    processQueue();
  }

  return id;
}

/**
 * Process email queue
 */
async function processQueue(): Promise<void> {
  if (processing.has('processor')) {
    return; // Already processing
  }

  processing.add('processor');

  try {
    while (emailQueue.length > 0) {
      const now = Date.now();
      const readyEmails = emailQueue.filter(
        email => email.scheduledAt <= now && !processing.has(email.id)
      );

      if (readyEmails.length === 0) {
        // No emails ready to process, wait a bit
        await sleep(1000);
        continue;
      }

      // Process emails concurrently (but limit concurrency)
      const promises = readyEmails.slice(0, 5).map(processEmail);
      await Promise.allSettled(promises);
    }
  } finally {
    processing.delete('processor');
  }
}

/**
 * Process a single email
 */
async function processEmail(queuedEmail: QueuedEmail): Promise<void> {
  if (processing.has(queuedEmail.id)) {
    return; // Already processing this email
  }

  processing.add(queuedEmail.id);

  try {
    queuedEmail.attempts++;

    console.log(`Processing email ${queuedEmail.id}, attempt ${queuedEmail.attempts}`);

    const result: EmailResult = await sendEmail({
      to: queuedEmail.to,
      subject: queuedEmail.subject,
      html: queuedEmail.html,
      react: queuedEmail.react,
      text: queuedEmail.text
    });

    if (result.success) {
      // Remove from queue on success
      const index = emailQueue.findIndex(e => e.id === queuedEmail.id);
      if (index !== -1) {
        emailQueue.splice(index, 1);
      }
      console.log(`Email ${queuedEmail.id} sent successfully`);
    } else {
      // Handle failure
      if (queuedEmail.attempts >= queuedEmail.maxAttempts) {
        // Max attempts reached, remove from queue
        const index = emailQueue.findIndex(e => e.id === queuedEmail.id);
        if (index !== -1) {
          emailQueue.splice(index, 1);
        }
        console.error(`Email ${queuedEmail.id} failed after ${queuedEmail.attempts} attempts:`, result.error);
      } else {
        // Schedule retry
        const delay = RETRY_DELAYS[queuedEmail.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        queuedEmail.scheduledAt = Date.now() + delay;
        console.log(`Email ${queuedEmail.id} failed, retrying in ${delay}ms`);
      }
    }
  } catch (error) {
    console.error(`Error processing email ${queuedEmail.id}:`, error);

    // Handle unexpected errors
    if (queuedEmail.attempts >= queuedEmail.maxAttempts) {
      const index = emailQueue.findIndex(e => e.id === queuedEmail.id);
      if (index !== -1) {
        emailQueue.splice(index, 1);
      }
    } else {
      const delay = RETRY_DELAYS[queuedEmail.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      queuedEmail.scheduledAt = Date.now() + delay;
    }
  } finally {
    processing.delete(queuedEmail.id);
  }
}

/**
 * Get queue status
 */
export function getQueueStatus() {
  return {
    pending: emailQueue.length,
    processing: processing.size - (processing.has('processor') ? 1 : 0),
    oldestEmail: emailQueue.length > 0 ? Math.min(...emailQueue.map(e => e.createdAt)) : null
  };
}

/**
 * Clear failed emails older than specified time
 */
export function clearOldEmails(maxAge: number = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAge;
  const initialLength = emailQueue.length;

  for (let i = emailQueue.length - 1; i >= 0; i--) {
    const email = emailQueue[i];
    if (email.createdAt < cutoff && email.attempts >= email.maxAttempts) {
      emailQueue.splice(i, 1);
    }
  }

  return initialLength - emailQueue.length;
}

/**
 * Utility functions
 */
function generateId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start queue processor on first email
if (typeof window === 'undefined') {
  // Only run on server side
  // Note: processQueue() is called automatically when emails are queued
  // Automatic cleanup interval has been removed to prevent memory leaks.
  // 
  // To clean up old emails in production, create an API route:
  // app/api/cron/cleanup-emails/route.ts
  // 
  // Example:
  // export async function GET() {
  //   const cleared = clearOldEmails();
  //   return Response.json({ cleared });
  // }
  //
  // Then trigger it with a cron service (Vercel Cron, GitHub Actions, etc.)
}
