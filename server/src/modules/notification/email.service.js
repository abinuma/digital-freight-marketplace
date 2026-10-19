import { config } from '../../shared/config/index.js';
import { logger } from '../../shared/utils/logger.js';
import { buildNotificationEmail } from './email.templates.js';

const BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

export function isEmailConfigured() {
  return Boolean(config.BREVO_API_KEY && config.EMAIL_FROM);
}

function parseSender(value) {
  const match = value.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  if (match) return { name: match[1], email: match[2] };
  return { email: value.trim() };
}

export async function sendEmail({ to, ...emailInput }) {
  if (!isEmailConfigured()) {
    logger.warn({ type: emailInput.type, recipient: to }, 'Email skipped because Brevo is not configured');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const content = buildNotificationEmail(emailInput);
    const response = await globalThis.fetch(BREVO_SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': config.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: parseSender(config.EMAIL_FROM),
        to: [{ email: to, ...(emailInput.recipientName ? { name: emailInput.recipientName } : {}) }],
        subject: content.subject,
        htmlContent: content.html,
        textContent: content.text,
      }),
      signal: globalThis.AbortSignal.timeout(10_000),
    });

    const responseText = await response.text();
    const result = responseText ? JSON.parse(responseText) : {};
    if (!response.ok) {
      logger.error({ status: response.status, body: result, type: emailInput.type, recipient: to }, 'Brevo API error response');
      throw new Error(`Brevo API returned ${response.status}: ${result.message || 'Email request failed'}`);
    }
    logger.info({ messageId: result.messageId, type: emailInput.type, recipient: to }, 'Brevo email accepted');
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    logger.error({ err: error, type: emailInput.type, recipient: to }, 'Brevo email delivery failed');
    return { sent: false, reason: 'delivery_failed' };
  }
}
