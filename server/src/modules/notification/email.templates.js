import { config } from '../../shared/config/index.js';

function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

export function buildNotificationEmail({ type, recipientName, shipment, bid, senderName, content }) {
  const brandName = 'FETAN digital freight marketplace';
  const logoUrl = new URL('/logoFETAN.png', config.CORS_ORIGIN).href;
  const shipmentLabel = shipment?.goodsDescription || 'your shipment';
  const route = [shipment?.pickupLocation, shipment?.deliveryLocation].filter(Boolean).join(' → ');
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  let subject;
  let message;
  let actionUrl;

  switch (type) {
    case 'BID_RECEIVED':
      subject = `New bid for ${shipmentLabel}`;
      message = `${senderName || 'A transporter'} submitted a bid${bid?.price != null ? ` of ETB ${bid.price}` : ''} for ${shipmentLabel}.`;
      break;
    case 'BID_ACCEPTED':
      subject = `Your bid was accepted for ${shipmentLabel}`;
      message = `Your bid${bid?.price != null ? ` of ETB ${bid.price}` : ''} was accepted for ${shipmentLabel}.`;
      break;
    case 'BID_DECLINED':
      subject = `Your bid was declined for ${shipmentLabel}`;
      message = `Your bid for ${shipmentLabel} was declined.`;
      break;
    case 'NEW_MESSAGE':
      subject = 'New message';
      message = `${senderName || 'A participant'} sent you a message${content ? `: ${content}` : '.'}`;
      break;
    case 'SHIPMENT_COMPLETED':
      subject = `Shipment completed: ${shipmentLabel}`;
      message = `${shipmentLabel} has been marked as completed.`;
      break;
    case 'SHIPMENT_REMOVED':
      subject = `Shipment listing removed: ${shipmentLabel}`;
      message = `The shipment listing for ${shipmentLabel} was removed by an administrator. Any pending bid you submitted has been closed.`;
      break;
    case 'WELCOME':
      subject = 'Welcome to FETAN';
      message = 'Your account has been created successfully.';
      break;
    case 'EMAIL_VERIFICATION_CODE':
      subject = 'Your FETAN Verification Code';
      message = `Your verification code is: ${content}. This code will expire in 10 minutes. If you did not request this, please ignore this email.`;
      break;
    case 'PASSWORD_RESET':
      subject = 'Reset your FETAN password';
      actionUrl = content;
      message = `Use this link to reset your password: ${content}`;
      break;
    default:
      throw new TypeError(`Unsupported email notification type: ${type}`);
  }

  const text = `${greeting}\n\n${message}${route ? `\nRoute: ${route}` : ''}\n\n${brandName}`;
  const htmlMessage = actionUrl
    ? `${escapeHtml(message.replace(actionUrl, ''))} <a href="${escapeHtml(actionUrl)}">Reset your password</a>.`
    : escapeHtml(message);
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px"><tr><td style="padding:24px 28px;border-bottom:1px solid #e2e8f0"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="vertical-align:middle;padding-right:12px"><img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="FETAN logo" style="display:block;width:44px;height:44px;object-fit:contain"></td><td style="vertical-align:middle;font-size:16px;font-weight:700;color:#0f172a">${brandName}</td></tr></table></td></tr><tr><td style="padding:28px;font-size:15px;line-height:1.6"><p style="margin:0 0 16px">${escapeHtml(greeting)}</p><p style="margin:0 0 16px">${htmlMessage}</p>${route ? `<p style="margin:0 0 16px">Route: ${escapeHtml(route)}</p>` : ''}</td></tr><tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">${brandName}</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}
