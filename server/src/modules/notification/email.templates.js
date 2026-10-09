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
      subject = `New shipment message: ${shipmentLabel}`;
      message = `${senderName || 'A participant'} sent a message about ${shipmentLabel}${content ? `: ${content}` : '.'}`;
      break;
    case 'SHIPMENT_COMPLETED':
      subject = `Shipment completed: ${shipmentLabel}`;
      message = `${shipmentLabel} has been marked as completed.`;
      break;
    case 'WELCOME':
      subject = 'Welcome to Digital Freight Marketplace';
      message = 'Your account has been created successfully.';
      break;
    case 'PASSWORD_RESET':
      subject = 'Reset your Digital Freight Marketplace password';
      actionUrl = content;
      message = `Use this link to reset your password: ${content}`;
      break;
    default:
      throw new TypeError(`Unsupported email notification type: ${type}`);
  }

  const text = `${greeting}\n\n${message}${route ? `\nRoute: ${route}` : ''}\n\nDigital Freight Marketplace`;
  const htmlMessage = actionUrl
    ? `${escapeHtml(message.replace(actionUrl, ''))} <a href="${escapeHtml(actionUrl)}">Reset your password</a>.`
    : escapeHtml(message);
  const html = `<p>${escapeHtml(greeting)}</p><p>${htmlMessage}</p>${route ? `<p>Route: ${escapeHtml(route)}</p>` : ''}<p>Digital Freight Marketplace</p>`;
  return { subject, text, html };
}
