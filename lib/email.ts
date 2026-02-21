interface RecoveryEmailPayload {
  to: string;
  invoiceId: string;
  amount: number;
  currency: string;
  recovered: boolean;
  customSubject?: string | null;
  customBody?: string | null;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100);
}

function renderTemplate(template: string, payload: RecoveryEmailPayload): string {
  return template
    .replaceAll('{{invoice_id}}', payload.invoiceId)
    .replaceAll('{{amount}}', formatAmount(payload.amount, payload.currency))
    .replaceAll('{{currency}}', payload.currency.toUpperCase());
}

export async function sendRecoveryEmail(payload: RecoveryEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL configuration.');
  }

  const fallbackSubject = payload.recovered ? '✅ Payment recovered successfully' : '⚠️ Payment retry attempted';
  const fallbackBody = payload.recovered
    ? `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="margin:0 0 12px;color:#111827;">Great news — payment recovered</h2>
        <p style="color:#374151;">Invoice <strong>${payload.invoiceId}</strong> has been recovered for <strong>${formatAmount(payload.amount, payload.currency)}</strong>.</p>
        <p style="color:#6b7280;">Your dunning flow is working and no action is needed.</p>
      </div>
    `
    : `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="margin:0 0 12px;color:#111827;">Payment retry attempted</h2>
        <p style="color:#374151;">We retried invoice <strong>${payload.invoiceId}</strong> for <strong>${formatAmount(payload.amount, payload.currency)}</strong>.</p>
        <p style="color:#6b7280;">We'll continue smart retries based on the configured delay schedule.</p>
      </div>
    `;

  const subject = payload.customSubject ? renderTemplate(payload.customSubject, payload) : fallbackSubject;
  const html = payload.customBody ? renderTemplate(payload.customBody, payload) : fallbackBody;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject,
      html
    })
  });

  if (!response.ok) {
    throw new Error(`Resend email failed: ${await response.text()}`);
  }
}
