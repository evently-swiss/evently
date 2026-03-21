import { format } from 'date-fns';

type InviteEmailPayload = {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: Date;
  venueName: string | null;
  inviteUrl: string;
};

type InviteEmailResult = {
  delivered: boolean;
  provider: 'resend' | 'smtp' | 'log';
};

function buildMessage(payload: InviteEmailPayload) {
  const eventDateText = format(payload.eventDate, 'EEEE, d MMM yyyy');
  const location = payload.venueName ? ` at ${payload.venueName}` : '';

  const text = [
    `Hi ${payload.guestName},`,
    '',
    `You are invited to ${payload.eventName}${location} on ${eventDateText}.`,
    'Please confirm or decline your attendance using this link:',
    payload.inviteUrl,
    '',
    'Thanks.',
  ].join('\n');

  const html = `
    <p>Hi ${payload.guestName},</p>
    <p>
      You are invited to <strong>${payload.eventName}</strong>${location} on ${eventDateText}.
    </p>
    <p>Please confirm or decline your attendance:</p>
    <p><a href="${payload.inviteUrl}">${payload.inviteUrl}</a></p>
    <p>Thanks.</p>
  `;

  return { text, html };
}

async function sendViaResend(payload: InviteEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL || 'Evently <onboarding@resend.dev>';
  const { text, html } = buildMessage(payload);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: `Invitation: ${payload.eventName}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed (${response.status}): ${body}`);
  }

  return true;
}

async function sendViaSmtp(payload: InviteEmailPayload): Promise<boolean> {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = process.env.EMAIL_SMTP_PORT;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const from = process.env.EMAIL_SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return false;
  }

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  const { text, html } = buildMessage(payload);
  await transporter.sendMail({
    from,
    to: payload.to,
    subject: `Invitation: ${payload.eventName}`,
    text,
    html,
  });

  return true;
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<InviteEmailResult> {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(payload);
    return { delivered: true, provider: 'resend' };
  }

  if (process.env.EMAIL_SMTP_HOST) {
    await sendViaSmtp(payload);
    return { delivered: true, provider: 'smtp' };
  }

  console.log('[invite-email:fallback]', {
    to: payload.to,
    inviteUrl: payload.inviteUrl,
    eventName: payload.eventName,
  });

  return { delivered: false, provider: 'log' };
}
