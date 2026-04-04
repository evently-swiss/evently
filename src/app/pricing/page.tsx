import { auth } from '@/lib/auth';

async function startCheckout() {
  'use server';
  const { redirect } = await import('next/navigation');
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/stripe/create-subscription-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = (await res.json()) as { url?: string };
  if (data.url) redirect(data.url);
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
