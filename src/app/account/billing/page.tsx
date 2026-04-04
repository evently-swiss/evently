import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

async function openBillingPortal() {
  'use server';
  const { redirect: serverRedirect } = await import('next/navigation');
  const session = await (await import('@/lib/auth')).auth();
  if (!session?.user?.id) return;

  const prismaModule = await import('@/lib/prisma');
  const sub = await prismaModule.default.operatorSubscription.findFirst({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!sub) return;

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const { getStripe } = await import('@/lib/stripe');

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId!,
    return_url: `${appUrl}/account/billing`,
  });

  if (portalSession.url) serverRedirect(portalSession.url);
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const sub = await prisma.operatorSubscription.findFirst({
    where: { userId: session.user.id },
  });

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Billing</h1>

        {sub ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Plan</span>
              <span className="text-sm font-medium text-white capitalize">Operator</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <span
                className={`text-sm font-semibold ${
                  sub.status === 'ACTIVE' || sub.status === 'TRIALING'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {sub.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Renews</span>
              <span className="text-sm text-white">
                {sub.periodEnd ? format(sub.periodEnd, 'PPP') : '—'}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <form action={openBillingPortal}>
                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Manage Subscription
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
            <p className="text-gray-400 mb-4">No active subscription.</p>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Subscribe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
