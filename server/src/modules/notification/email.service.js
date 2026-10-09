import nodemailer from 'nodemailer';
import { config } from '../../shared/config/index.js';
import { logger } from '../../shared/utils/logger.js';
import { buildNotificationEmail } from './email.templates.js';

let transporter;

export function isEmailConfigured() {
  return Boolean(config.GMAIL_USER && config.GMAIL_APP_PASSWORD);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.GMAIL_USER, pass: config.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail({ to, ...emailInput }) {
  const mailTransport = getTransporter();
  if (!mailTransport) {
    logger.warn({ type: emailInput.type, recipient: to }, 'Email skipped because Gmail SMTP is not configured');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const content = buildNotificationEmail(emailInput);
    await mailTransport.sendMail({
      from: config.EMAIL_FROM || config.GMAIL_USER,
      to,
      ...content,
    });
    return { sent: true };
  } catch (error) {
    logger.error({ err: error, type: emailInput.type, recipient: to }, 'Email delivery failed');
    return { sent: false, reason: 'delivery_failed' };
  }
}
