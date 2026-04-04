type VerificationEmailPayload = {
  to: string;
  token: string;
};

type VerificationEmailResult = {
  delivered: boolean;
  provider: 'resend' | 'smtp' | 'log';
};

function buildVerificationLink(token: string): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  if (process.env.NODE_ENV === 'production' && appUrl.includes('localhost')) {
    console.warn('[verification-email] NEXTAUTH_URL appears to be localhost in production — email links will not work for external users.');
  }
  return `${appUrl.replace(/\/$/, '')}/auth/verify?token=${encodeURIComponent(token)}`;
}

function buildMessage(link: string) {
  const text = [
    'Welcome to Evently.',
    '',
    'Please verify your email by clicking this link:',
    link,
  ].join('\n');

  const html = `
    <p>Welcome to Evently.</p>
    <p>Please verify your email by clicking this link:</p>
    <p><a href="${link}">${link}</a></p>
  `;

  return { text, html };
}

async function sendViaResend(payload: VerificationEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const link = buildVerificationLink(payload.token);
  const { text, html } = buildMessage(link);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Evently <onboarding@resend.dev>',
      to: [payload.to],
      subject: 'Verify your Evently account',
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

async function sendViaSmtp(payload: VerificationEmailPayload): Promise<boolean> {
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

  const link = buildVerificationLink(payload.token);
  const { text, html } = buildMessage(link);

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: 'Verify your Evently account',
    text,
    html,
  });

  return true;
}

export async function sendVerificationEmail(
  payload: VerificationEmailPayload,
): Promise<VerificationEmailResult> {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(payload);
    return { delivered: true, provider: 'resend' };
  }

  if (process.env.EMAIL_SMTP_HOST) {
    await sendViaSmtp(payload);
    return { delivered: true, provider: 'smtp' };
  }

  console.log('[verification-email:fallback]', {
    to: payload.to,
    verificationUrl: buildVerificationLink(payload.token),
  });

  return { delivered: false, provider: 'log' };
}
