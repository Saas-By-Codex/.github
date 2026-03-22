export interface StripeInvoice {
  id: string;
  status: string;
  paid: boolean;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  customer_email?: string | null;
}

interface StripeListResponse {
  data: Array<{
    id: string;
    status: string;
    paid: boolean;
    amount_due: number;
    amount_paid: number;
    currency: string;
    created: number;
    customer_email?: string | null;
  }>;
}

function stripeHeaders(secretKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
}

export async function listRecentFailedInvoices(secretKey: string, createdGteUnix: number): Promise<StripeInvoice[]> {
  const params = new URLSearchParams({
    status: 'open',
    limit: '100',
    'created[gte]': String(createdGteUnix)
  });

  const response = await fetch(`https://api.stripe.com/v1/invoices?${params.toString()}`, {
    method: 'GET',
    headers: stripeHeaders(secretKey),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Stripe invoice fetch failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as StripeListResponse;
  return payload.data.filter((invoice) => !invoice.paid && (invoice.status === 'open' || invoice.status === 'uncollectible'));
}

export async function retryInvoicePayment(secretKey: string, invoiceId: string): Promise<StripeInvoice> {
  const response = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: stripeHeaders(secretKey),
    body: ''
  });

  if (!response.ok) {
    throw new Error(`Stripe retry failed: ${await response.text()}`);
  }

  return (await response.json()) as StripeInvoice;
}
