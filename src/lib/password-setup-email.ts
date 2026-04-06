type PasswordSetupEmailPayload = {
  to: string;
  name: string | null;
  token: string;
};

type PasswordSetupEmailResult = {
  delivered: boolean;
  provider: 'resend' | 'smtp' | 'log';
};

function buildSetupLink(token: string): string {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${appUrl.replace(/\/$/, '')}/auth/setup-password?token=${encodeURIComponent(token)}`;
}

function buildMessage(name: string | null, link: string) {
  const greeting = name ? `Hi ${name},` : 'Hello,';

  const text = [
    greeting,
    '',
    'An account has been created for you on Evently.',
    'Please click the link below to set your password and activate your account:',
    link,
    '',
    'This link will expire in 72 hours.',
  ].join('\n');

  const html = `
    <p>${greeting}</p>
    <p>An account has been created for you on Evently.</p>
    <p>Please click the link below to set your password and activate your account:</p>
    <p><a href="${link}">${link}</a></p>
    <p style="color: #6b7280; font-size: 0.875rem;">This link will expire in 72 hours.</p>
  `;

  return { text, html };
}

async function sendViaResend(payload: PasswordSetupEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const link = buildSetupLink(payload.token);
  const { text, html } = buildMessage(payload.name, link);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Evently <onboarding@resend.dev>',
      to: [payload.to],
      subject: 'Set up your Evently password',
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

async function sendViaSmtp(payload: PasswordSetupEmailPayload): Promise<boolean> {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = process.env.EMAIL_SMTP_PORT;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const from = process.env.EMAIL_SMTP_FROM;

  if (!host || !port || !user || !pass || !from) return false;

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  const link = buildSetupLink(payload.token);
  const { text, html } = buildMessage(payload.name, link);

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: 'Set up your Evently password',
    text,
    html,
  });

  return true;
}

export async function sendPasswordSetupEmail(
  payload: PasswordSetupEmailPayload,
): Promise<PasswordSetupEmailResult> {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(payload);
    return { delivered: true, provider: 'resend' };
  }

  if (process.env.EMAIL_SMTP_HOST) {
    await sendViaSmtp(payload);
    return { delivered: true, provider: 'smtp' };
  }

  console.log('[password-setup-email:fallback]', {
    to: payload.to,
    setupUrl: buildSetupLink(payload.token),
  });

  return { delivered: false, provider: 'log' };
}
