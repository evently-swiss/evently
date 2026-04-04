import { auth } from '@/lib/auth';

async function startCheckout() {
  'use server';
  const { redirect } = await import('next/navigation');
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect('/login');
  }

  const priceId = process.env.STRIPE_OPERATOR_PRICE_ID;
  if (!priceId) throw new Error('Stripe price not configured');

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const { getStripe } = await import('@/lib/stripe');

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: session.user.id },
    success_url: `${appUrl}/admin`,
    cancel_url: `${appUrl}/pricing`,
  });

  if (checkoutSession.url) redirect(checkoutSession.url);
}

export default async function PricingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Operator Subscription Required</h1>
        <p className="text-gray-400 mb-8">
          An active subscription is required to use guestlist and lounge management features.
        </p>
        {session ? (
          <form action={startCheckout}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Subscribe Now
            </button>
          </form>
        ) : (
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Log in to Subscribe
          </a>
        )}
      </div>
    </div>
  );
}
